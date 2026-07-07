import {
	data,
	Variable,
	_,
	advancement,
	Advancement,
	execute,
	MCFunction,
	type MCFunctionClass,
	Objective,
	type Score,
	Selector,
	kill,
	tag,
} from 'sandstone'
import { type JSONTextComponent } from 'sandstone/arguments'
import { songCount, songNames } from '@rhythm/config/internal/songs'
import { leaderboard as leaderboardConfig } from '@rhythm/config'
import { panels } from '@rhythm/config/internal/derived'
import { GameStatus, Tags, status, songSelect, leaderboardSongView, leaderboardCategoryView, gamePlayer } from './state'
import { finalScore } from './scoring'
import { hitsTaken } from './walls/collision'
import {
	spawnPanel,
	spawnPanelLines,
	spawnClick,
	lineY,
	clampName,
	needsScroll,
	scrollFrame,
	scrollFrameCount,
	mergeDisplayText,
} from '@rhythm/hologram'
import { NAMESPACE, ticking } from '@shared'

const bestScores: ReturnType<typeof Objective.create>[] = []
const deathlessScores: ReturnType<typeof Objective.create>[] = []
for (let i = 0; i < songCount; i++) {
	bestScores.push(Objective.create(`rlb.s${i}`, 'dummy'))
	deathlessScores.push(Objective.create(`rlb.s${i}d`, 'dummy'))
}

// the panel renders 16 lines; TOTAL_LINES=15 + CLICK_Y_OFFSET is the calibrated click grid
const RENDER_LINES = 16
const SONGCAT_LINE = 1
const ROWS_LINE = 2
const YOU_LINE = 12

const TOTAL_LINES = 15
const CLICK_Y_OFFSET = 0.25

const songCatLineSel = Selector('@e', { tag: Tags.UI_LB_SONG_TXT, limit: 1 })
const rowsSel = Selector('@e', { tag: Tags.UI_LB_ROWS_TXT, limit: 1 })
const youLineSel = Selector('@e', { tag: Tags.UI_LB_YOU_TXT, limit: 1 })

const rankSlots: Score[] = []
for (let i = 0; i < leaderboardConfig.size; i++) {
	rankSlots.push(Variable(0))
}
const highestScore = Variable(0)
const myScore = Variable(0)
const myRank = Variable(0)

const scrollPos = Variable(0)

const LB_SEL = Tags.LB_SELECTION
const RANK_TAGS = Array.from({ length: leaderboardConfig.size }, (_, i) => `ssb.lb.r${i + 1}`)

// the viewed objective is copied here so one shared selection sort covers every song and category
const sortScratch = Objective.create('rlb.sort', 'dummy')

const runSort = MCFunction(
	'sections/rhythm/leaderboard/sort/run',
	() => {
		for (let rank = 0; rank < leaderboardConfig.size; rank++) {
			highestScore.set(0)
			execute.as(Selector('@a', { tag: `!${LB_SEL}` })).run(() => {
				_.if(sortScratch('@s').greaterThan(highestScore), () => {
					highestScore.set(sortScratch('@s'))
				})
			})
			_.if(highestScore.greaterThan(0), () => {
				rankSlots[rank].set(highestScore)
				execute.as(Selector('@a', { tag: `!${LB_SEL}` })).run(() => {
					_.if(sortScratch('@s').equalTo(rankSlots[rank]), () => {
						tag('@s').add(LB_SEL)
						tag('@s').add(RANK_TAGS[rank])
					})
				})
			})
		}
		tag(Selector('@a', { tag: LB_SEL })).remove(LB_SEL)
	},
	{ lazy: true },
)

const sortLeaderboard = MCFunction(
	'sections/rhythm/leaderboard/sort',
	() => {
		for (let i = 0; i < leaderboardConfig.size; i++) {
			rankSlots[i].set(0)
			tag(Selector('@a', { tag: RANK_TAGS[i] })).remove(RANK_TAGS[i])
		}
		const copyScores = (songI: number) => {
			_.if(leaderboardCategoryView.equalTo(0), () => {
				execute.as(Selector('@a')).run(() => {
					sortScratch('@s').set(0)
					sortScratch('@s').set(bestScores[songI]('@s'))
				})
			}).else(() => {
				execute.as(Selector('@a')).run(() => {
					sortScratch('@s').set(0)
					sortScratch('@s').set(deathlessScores[songI]('@s'))
				})
			})
		}
		_.switch(
			leaderboardSongView,
			Array.from({ length: songCount }, (_v, songI) => ['case', songI, () => copyScores(songI)] as const),
		)
		runSort()
	},
	{ lazy: true },
)

function scoreComponent(score: Score): JSONTextComponent {
	return { score: { name: `${score.target}`, objective: score.objective.name } }
}

const BLANK_LINE: JSONTextComponent = { text: ' ' }

function songCatLineText(songI: number, catI: number, nameOverride?: string): JSONTextComponent {
	const songName = nameOverride ?? clampName(songNames[songI] ?? 'No songs')
	const catName = catI === 0 ? 'Best Score' : 'Deathless'
	const catColor = catI === 0 ? 'gold' : 'light_purple'
	return [
		{ text: `${panels.padding}♪ `, color: 'gold' },
		{ text: songName, color: 'yellow', font: 'monocraft:default' },
		{ text: ' - ', color: 'gray' },
		{ text: `${catName}${panels.padding}`, color: catColor },
	]
}

const ROWS_TEXT: JSONTextComponent = rankSlots.flatMap((slot, i): JSONTextComponent[] => {
	const color = leaderboardConfig.rankColors[Math.min(i, 3)]
	return [
		{ text: i === 0 ? '' : '\n' },
		{ text: `${panels.padding}#${i + 1} `, color },
		{ selector: `@a[tag=${RANK_TAGS[i]},limit=1]`, color: 'white' },
		{ text: ' ' },
		scoreComponent(slot),
		{ text: panels.padding },
	]
})

const YOU_TEXT: JSONTextComponent = [
	{ text: `${panels.padding}You: `, color: 'green' },
	scoreComponent(myScore),
	{ text: ' | #', color: 'gray' },
	scoreComponent(myRank),
	{ text: panels.padding },
]

// selector/score components resolve when the text is set, so re-merging refreshes the rows
const refreshRows = MCFunction(
	'sections/rhythm/leaderboard/rows',
	() => {
		mergeDisplayText(rowsSel, ROWS_TEXT)
	},
	{ lazy: true },
)

const scrollingSongs = Array.from({ length: songCount }, (_v, i) => i).filter((i) => needsScroll(songNames[i]))

const updateSongCatLine = MCFunction(
	'sections/rhythm/leaderboard/song_line',
	() => {
		if (songCount === 0) return
		const renderCase = (songI: number) => {
			_.if(leaderboardCategoryView.equalTo(0), () => {
				mergeDisplayText(songCatLineSel, songCatLineText(songI, 0))
			}).else(() => {
				mergeDisplayText(songCatLineSel, songCatLineText(songI, 1))
			})
			if (scrollingSongs.includes(songI)) {
				lbScrollLoop.schedule.function(`${panels.scrollSpeed}t`, 'replace')
			}
		}
		_.switch(
			leaderboardSongView,
			Array.from({ length: songCount }, (_v, songI) => ['case', songI, () => renderCase(songI)] as const),
		)
	},
	{ lazy: true },
)

const updateDisplay = MCFunction(
	'sections/rhythm/leaderboard/update',
	() => {
		scrollPos.set(0)
		sortLeaderboard()
		updateSongCatLine()
		refreshRows()
		mergeDisplayText(youLineSel, BLANK_LINE)
	},
	{ lazy: true },
)

const scrollLbUpdate = MCFunction(
	'sections/rhythm/leaderboard/scroll',
	() => {
		for (const songI of scrollingSongs) {
			const name = songNames[songI]
			_.if(leaderboardSongView.equalTo(songI), () => {
				const frames = scrollFrameCount(name)
				_.if(scrollPos.greaterThanOrEqualTo(frames), () => {
					scrollPos.set(0)
				})
				for (let offset = 0; offset < frames; offset++) {
					_.if(scrollPos.equalTo(offset), () => {
						const visible = scrollFrame(name, offset)
						_.if(leaderboardCategoryView.equalTo(0), () => {
							mergeDisplayText(songCatLineSel, songCatLineText(songI, 0, visible))
						}).else(() => {
							mergeDisplayText(songCatLineSel, songCatLineText(songI, 1, visible))
						})
					})
				}
			})
		}
	},
	{ lazy: true },
)

// runs only while a long song name is on the panel; dies on its own otherwise
const lbScrollLoop = MCFunction(
	'sections/rhythm/leaderboard/scroll_loop',
	(self: MCFunctionClass) => {
		scrollPos.add(1)
		scrollLbUpdate()
		for (const songI of scrollingSongs) {
			_.if(leaderboardSongView.equalTo(songI), () => {
				self.schedule.function(`${panels.scrollSpeed}t`, 'replace')
			})
		}
	},
	{ lazy: true },
)

Advancement('ui_lb_song', {
	criteria: {
		click: {
			trigger: 'minecraft:player_interacted_with_entity',
			conditions: {
				entity: { entity_type: 'minecraft:interaction', nbt: `{Tags:["${Tags.UI_LB_SONG_INT}"]}` },
			},
		},
	},
})

Advancement('ui_lb_cat', {
	criteria: {
		click: {
			trigger: 'minecraft:player_interacted_with_entity',
			conditions: {
				entity: { entity_type: 'minecraft:interaction', nbt: `{Tags:["${Tags.UI_LB_CAT_INT}"]}` },
			},
		},
	},
})

Advancement('ui_lb_my', {
	criteria: {
		click: {
			trigger: 'minecraft:player_interacted_with_entity',
			conditions: {
				entity: { entity_type: 'minecraft:interaction', nbt: `{Tags:["${Tags.UI_LB_MY_INT}"]}` },
			},
		},
	},
})

const onSongCycle = MCFunction(
	'sections/rhythm/leaderboard/on_song',
	() => {
		_.if(status.equalTo(GameStatus.WAITING), () => {
			leaderboardSongView.add(1)
			_.if(leaderboardSongView.greaterThanOrEqualTo(songCount), () => {
				leaderboardSongView.set(0)
			})
			updateDisplay()
			execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
		})
	},
	{ lazy: true },
)

const onSongCycleBack = MCFunction(
	'sections/rhythm/leaderboard/on_song_back',
	() => {
		_.if(status.equalTo(GameStatus.WAITING), () => {
			leaderboardSongView.remove(1)
			_.if(leaderboardSongView.lessThan(0), () => {
				leaderboardSongView.set(Math.max(songCount - 1, 0))
			})
			updateDisplay()
			execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
		})
	},
	{ lazy: true },
)

const onCatToggle = MCFunction(
	'sections/rhythm/leaderboard/on_cat',
	() => {
		_.if(status.equalTo(GameStatus.WAITING), () => {
			_.if(leaderboardCategoryView.equalTo(0), () => {
				leaderboardCategoryView.set(1)
			}).else(() => {
				leaderboardCategoryView.set(0)
			})
			updateDisplay()
			execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
		})
	},
	{ lazy: true },
)

const onMyScore = MCFunction(
	'sections/rhythm/leaderboard/on_myscore',
	() => {
		const computeMyRank = (songI: number) => {
			_.if(leaderboardCategoryView.equalTo(0), () => {
				myScore.set(bestScores[songI]('@s'))
				myRank.set(1)
				execute.as(Selector('@a')).run(() => {
					_.if(bestScores[songI]('@s').greaterThan(myScore), () => {
						myRank.add(1)
					})
				})
			}).else(() => {
				myScore.set(deathlessScores[songI]('@s'))
				myRank.set(1)
				execute.as(Selector('@a')).run(() => {
					_.if(deathlessScores[songI]('@s').greaterThan(myScore), () => {
						myRank.add(1)
					})
				})
			})
		}
		_.switch(
			leaderboardSongView,
			Array.from({ length: songCount }, (_v, songI) => ['case', songI, () => computeMyRank(songI)] as const),
		)
		mergeDisplayText(youLineSel, YOU_TEXT)
		execute.at('@s').run.playsound('minecraft:entity.player.levelup', 'master', '@s')
	},
	{ lazy: true },
)

export const saveLeaderboard = MCFunction(
	'sections/rhythm/leaderboard/save',
	() => {
		execute.as(gamePlayer).run(() => {
			for (let i = 0; i < songCount; i++) {
				const idx = i
				_.if(songSelect.equalTo(idx), () => {
					_.if(finalScore('@s').greaterThan(bestScores[idx]('@s')), () => {
						bestScores[idx]('@s').set(finalScore('@s'))
					})
					_.if(hitsTaken('@s').equalTo(0), () => {
						_.if(finalScore('@s').greaterThan(deathlessScores[idx]('@s')), () => {
							deathlessScores[idx]('@s').set(finalScore('@s'))
						})
					})
				})
			}
		})

		leaderboardSongView.set(songSelect)
		updateDisplay()
	},
	{ lazy: true },
)

// left click steps backwards / toggles: the interaction records the attack in nbt
function onAttack(buttonTag: Tags, handler: () => void) {
	execute
		.as(Selector('@e', { type: 'minecraft:interaction', tag: buttonTag }))
		.at('@s')
		.if.data.entity('@s', 'attack')
		.run(() => {
			data.remove.entity('@s', 'attack')
			execute.as('@p').run(() => {
				handler()
			})
		})
}

export const leaderboardTick = MCFunction(
	'sections/rhythm/leaderboard/tick',
	() => {
		onAttack(Tags.UI_LB_SONG_INT, () => onSongCycleBack())
		onAttack(Tags.UI_LB_CAT_INT, () => onCatToggle())

		execute.as(Selector('@a', { advancements: { [`${NAMESPACE}:ui_lb_song`]: true } })).run(() => {
			onSongCycle()
			advancement.revoke('@s').only(`${NAMESPACE}:ui_lb_song`)
		})
		execute.as(Selector('@a', { advancements: { [`${NAMESPACE}:ui_lb_cat`]: true } })).run(() => {
			onCatToggle()
			advancement.revoke('@s').only(`${NAMESPACE}:ui_lb_cat`)
		})
		execute.as(Selector('@a', { advancements: { [`${NAMESPACE}:ui_lb_my`]: true } })).run(() => {
			onMyScore()
			advancement.revoke('@s').only(`${NAMESPACE}:ui_lb_my`)
		})
	},
	{ lazy: true },
)

MCFunction(
	'sections/rhythm/leaderboard/init',
	() => {
		leaderboardSongView.set(0)
		leaderboardCategoryView.set(0)
		scrollPos.set(0)

		updateDisplay()
	},
	{ runOnLoad: true },
)

const BACKDROP_TEXT: JSONTextComponent = [
	{ text: `${panels.padding}🏆 `, color: 'gold' },
	{ text: `LEADERBOARD${panels.padding}`, color: 'white', bold: true },
	{ text: '\n\n\n\n\n\n\n\n\n\n\n\n\n' },
	{ text: `${panels.padding}◀ Song ▶`, color: 'aqua' },
	{ text: '  ' },
	{ text: `◀ Cat ▶${panels.padding}`, color: 'light_purple' },
	{ text: '\n' },
	{ text: `${panels.padding}📊 My Score${panels.padding}`, color: 'green' },
	{ text: `\n${panels.ruler}` },
]

MCFunction(
	'sections/rhythm/leaderboard/spawn',
	() => {
		kill(Selector('@e', { tag: Tags.UI_LEADERBOARD }))

		spawnPanel(panels.leaderboard, [Tags.UI_LEADERBOARD, Tags.UI_LB_TXT], BACKDROP_TEXT, 0)
		spawnPanelLines(panels.leaderboard, [Tags.UI_LEADERBOARD, Tags.UI_LB_SONG_TXT], RENDER_LINES, SONGCAT_LINE)
		spawnPanelLines(
			panels.leaderboard,
			[Tags.UI_LEADERBOARD, Tags.UI_LB_ROWS_TXT],
			RENDER_LINES,
			ROWS_LINE,
			leaderboardConfig.size,
		)
		spawnPanelLines(panels.leaderboard, [Tags.UI_LEADERBOARD, Tags.UI_LB_YOU_TXT], RENDER_LINES, YOU_LINE)
		updateDisplay()

		const btnY = lineY(panels.leaderboard, TOTAL_LINES, 13)
		spawnClick(panels.leaderboard, -0.75, btnY, [Tags.UI_LEADERBOARD, Tags.UI_LB_SONG_INT], 1.5, CLICK_Y_OFFSET)
		spawnClick(panels.leaderboard, 0.75, btnY, [Tags.UI_LEADERBOARD, Tags.UI_LB_CAT_INT], 1.5, CLICK_Y_OFFSET)

		const myY = lineY(panels.leaderboard, TOTAL_LINES, 14)
		spawnClick(panels.leaderboard, 0, myY, [Tags.UI_LEADERBOARD, Tags.UI_LB_MY_INT], 3, CLICK_Y_OFFSET)
	},
	{ runOnLoad: true },
)
