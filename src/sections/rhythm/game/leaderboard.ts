import { _, advancement, Advancement, data, execute, MCFunction, Objective, scoreboard, Selector, kill, tag } from 'sandstone'
import { songCount, songNames } from '../config/songs'
import { LEADERBOARD, PADDING, RULER, SCROLL_SPEED } from '../config/panels'
import { GameStatus, Tags, status, songSelect, lbSongView, lbCatView, allPlayers } from './state'
import { finalScore } from './scoring'
import { wallLives } from './walls/collision'
import { livesSetting } from './settings'
import { spawnPanel, spawnClick, lineY, clampName, needsScroll, scrollFrame, scrollFrameCount } from '../hologram'
import { DIM, NAMESPACE, state } from '../../../shared'

const T = Tags

const lbBest: ReturnType<typeof Objective.create>[] = []
const lbNoDeath: ReturnType<typeof Objective.create>[] = []
for (let i = 0; i < songCount; i++) {
	lbBest.push(Objective.create(`rlb.s${i}`, 'dummy'))
	lbNoDeath.push(Objective.create(`rlb.s${i}d`, 'dummy'))
}

const TOTAL_LINES = 15

const P = LEADERBOARD
const panelSel = Selector('@e', { tag: T.UI_LB_TXT, limit: 1 })

const lbSlots: ReturnType<typeof state>[] = []
for (let i = 0; i < 10; i++) {
	lbSlots.push(state(`#lb${i + 1}`))
}
const lbMax = state('$lb_max')
const lbScore = state('$lb_score')
const lbRank = state('$lb_rank')

const scrollPos = state('$scroll_lb')
const scrollTimer = state('$scroll_t_lb')

const LB_SEL = 'ssb.lb.sel'
const RANK_TAGS = Array.from({ length: 10 }, (_, i) => `ssb.lb.r${i + 1}`)

function makeSortFn(si: number, ci: number) {
	const obj = ci === 0 ? lbBest[si] : lbNoDeath[si]
	const label = ci === 0 ? 'best' : 'death'
	return MCFunction(`sections/rhythm/leaderboard/sort/${label}_${si}`, () => {
		for (let rank = 0; rank < 10; rank++) {
			lbMax.set(0)
			execute.as(Selector('@a', { tag: `!${LB_SEL}` })).run(() => {
				_.if(obj('@s').greaterThan(lbMax), () => {
					lbMax.set(obj('@s'))
				})
			})
			_.if(lbMax.greaterThan(0), () => {
				lbSlots[rank].set(lbMax)
				execute.as(Selector('@a', { tag: `!${LB_SEL}` })).run(() => {
					_.if(obj('@s').equalTo(lbSlots[rank]), () => {
						tag('@s').add(LB_SEL)
						tag('@s').add(RANK_TAGS[rank])
					})
				})
			})
		}
		tag(Selector('@a')).remove(LB_SEL)
	}, { lazy: true })
}

const sortFns: ReturnType<typeof MCFunction>[] = []
for (let si = 0; si < songCount; si++) {
	sortFns.push(makeSortFn(si, 0))
	sortFns.push(makeSortFn(si, 1))
}

const sortLeaderboard = MCFunction('sections/rhythm/leaderboard/sort', () => {
	for (let i = 0; i < 10; i++) {
		lbSlots[i].set(0)
		tag(Selector('@a')).remove(RANK_TAGS[i])
	}
	for (let si = 0; si < songCount; si++) {
		_.if(lbSongView.equalTo(si), () => {
			_.if(lbCatView.equalTo(0), () => {
				sortFns[si * 2]()
			}).else(() => {
				sortFns[si * 2 + 1]()
			})
		})
	}
}, { lazy: true })

const RANK_COLORS = ['gold', 'gray', 'red', 'dark_gray']
const STATE_OBJ = `${NAMESPACE}.rhythm.state`

function buildLbText(songIdx: number, catIdx: number, scoreLine: any[], nameOverride?: string): any[] {
	const pad = PADDING
	const songName = nameOverride ?? clampName(songNames[songIdx] ?? 'No songs')
	const catName = catIdx === 0 ? 'Best Score' : 'Deathless'
	const catColor = catIdx === 0 ? 'gold' : 'light_purple'

	const parts: any[] = [
		{ text: `${pad}🏆 `, color: 'gold' }, { text: `LEADERBOARD${pad}`, color: 'white', bold: true },
		{ text: '\n' },
		{ text: `${pad}♪ `, color: 'gold' }, { text: songName, color: 'yellow', font: 'monocraft:default' },
		{ text: ' - ', color: 'gray' }, { text: `${catName}${pad}`, color: catColor },
	]

	for (let i = 0; i < 10; i++) {
		const color = RANK_COLORS[Math.min(i, 3)]
		parts.push({ text: '\n' })
		parts.push({ text: `${pad}#${i + 1} `, color })
		parts.push({ selector: `@a[tag=${RANK_TAGS[i]},limit=1]`, color: 'white' })
		parts.push({ text: ' ' })
		parts.push({ score: { name: `#lb${i + 1}`, objective: STATE_OBJ } })
		parts.push({ text: pad })
	}

	if (scoreLine.length > 0) {
		parts.push({ text: '\n' }, ...scoreLine)
	} else {
		parts.push({ text: '\n' })
	}

	parts.push({ text: '\n' })
	parts.push({ text: `${pad}◀ Song ▶`, color: 'aqua' })
	parts.push({ text: '  ' })
	parts.push({ text: `◀ Cat ▶${pad}`, color: 'light_purple' })
	parts.push({ text: '\n' })
	parts.push({ text: `${pad}📊 My Score${pad}`, color: 'green' })
	parts.push({ text: `\n${RULER}` })

	return parts
}

function lbText(si: number, ci: number, nameOverride?: string) {
	return buildLbText(si, ci, [], nameOverride)
}

function lbMyText(si: number, ci: number) {
	return buildLbText(si, ci, [
		{ text: `${PADDING}You: `, color: 'green' },
		{ score: { name: '$lb_score', objective: STATE_OBJ } },
		{ text: ' | #', color: 'gray' },
		{ score: { name: '$lb_rank', objective: STATE_OBJ } },
		{ text: PADDING },
	])
}

Advancement('ui_lb_song', {
	criteria: {
		click: {
			trigger: 'minecraft:player_interacted_with_entity',
			conditions: {
				entity: { type: 'minecraft:interaction', nbt: `{Tags:["${T.UI_LB_SONG_INT}"]}` },
			},
		},
	},
})

Advancement('ui_lb_cat', {
	criteria: {
		click: {
			trigger: 'minecraft:player_interacted_with_entity',
			conditions: {
				entity: { type: 'minecraft:interaction', nbt: `{Tags:["${T.UI_LB_CAT_INT}"]}` },
			},
		},
	},
})

Advancement('ui_lb_my', {
	criteria: {
		click: {
			trigger: 'minecraft:player_interacted_with_entity',
			conditions: {
				entity: { type: 'minecraft:interaction', nbt: `{Tags:["${T.UI_LB_MY_INT}"]}` },
			},
		},
	},
})

const updateSidebar = MCFunction('sections/rhythm/leaderboard/sidebar', () => {
	for (let i = 0; i < songCount; i++) {
		const idx = i
		_.if(lbSongView.equalTo(idx), () => {
			_.if(lbCatView.equalTo(0), () => {
				scoreboard.objectives.setdisplay('sidebar', `rlb.s${idx}`)
			}).else(() => {
				scoreboard.objectives.setdisplay('sidebar', `rlb.s${idx}d`)
			})
		})
	}
}, { lazy: true })

const updateDisplay = MCFunction('sections/rhythm/leaderboard/update', () => {
	scrollPos.set(0)
	scrollTimer.set(0)
	sortLeaderboard()
	for (let si = 0; si < songCount; si++) {
		_.if(lbSongView.equalTo(si), () => {
			_.if(lbCatView.equalTo(0), () => {
				data.merge.entity(panelSel, { text: lbText(si, 0) })
			}).else(() => {
				data.merge.entity(panelSel, { text: lbText(si, 1) })
			})
		})
	}
	updateSidebar()
}, { lazy: true })

const scrollLbUpdate = MCFunction('sections/rhythm/leaderboard/scroll', () => {
	for (let si = 0; si < songCount; si++) {
		const name = songNames[si]
		if (!needsScroll(name)) continue
		_.if(lbSongView.equalTo(si), () => {
			const frames = scrollFrameCount(name)
			_.if(scrollPos.greaterOrEqualThan(frames), () => {
				scrollPos.set(0)
			})
			for (let offset = 0; offset < frames; offset++) {
				_.if(scrollPos.equalTo(offset), () => {
					const visible = scrollFrame(name, offset)
					_.if(lbCatView.equalTo(0), () => {
						data.merge.entity(panelSel, { text: lbText(si, 0, visible) })
					}).else(() => {
						data.merge.entity(panelSel, { text: lbText(si, 1, visible) })
					})
				})
			}
		})
	}
}, { lazy: true })

const onSongCycle = MCFunction('sections/rhythm/leaderboard/on_song', () => {
	_.if(status.equalTo(GameStatus.WAITING), () => {
		lbSongView.add(1)
		_.if(lbSongView.greaterOrEqualThan(songCount), () => {
			lbSongView.set(0)
		})
		updateDisplay()
		execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
	})
}, { lazy: true })

const onCatToggle = MCFunction('sections/rhythm/leaderboard/on_cat', () => {
	_.if(status.equalTo(GameStatus.WAITING), () => {
		_.if(lbCatView.equalTo(0), () => {
			lbCatView.set(1)
		}).else(() => {
			lbCatView.set(0)
		})
		updateDisplay()
		execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
	})
}, { lazy: true })

const onMyScore = MCFunction('sections/rhythm/leaderboard/on_myscore', () => {
	for (let si = 0; si < songCount; si++) {
		_.if(lbSongView.equalTo(si), () => {
			_.if(lbCatView.equalTo(0), () => {
				lbScore.set(lbBest[si]('@s'))
				lbRank.set(1)
				execute.as(Selector('@a')).run(() => {
					_.if(lbBest[si]('@s').greaterThan(lbScore), () => {
						lbRank.add(1)
					})
				})
				data.merge.entity(panelSel, { text: lbMyText(si, 0) })
			}).else(() => {
				lbScore.set(lbNoDeath[si]('@s'))
				lbRank.set(1)
				execute.as(Selector('@a')).run(() => {
					_.if(lbNoDeath[si]('@s').greaterThan(lbScore), () => {
						lbRank.add(1)
					})
				})
				data.merge.entity(panelSel, { text: lbMyText(si, 1) })
			})
		})
	}
	execute.at('@s').run.playsound('minecraft:entity.player.levelup', 'master', '@s')
}, { lazy: true })

export const saveLeaderboard = MCFunction('sections/rhythm/leaderboard/save', () => {
	execute.as(allPlayers).run(() => {
		for (let i = 0; i < songCount; i++) {
			const idx = i
			_.if(songSelect.equalTo(idx), () => {
				_.if(finalScore('@s').greaterThan(lbBest[idx]('@s')), () => {
					lbBest[idx]('@s').set(finalScore('@s'))
				})
				_.if(wallLives('@s').greaterOrEqualThan(livesSetting), () => {
					_.if(finalScore('@s').greaterThan(lbNoDeath[idx]('@s')), () => {
						lbNoDeath[idx]('@s').set(finalScore('@s'))
					})
				})
			})
		}
	})

	lbSongView.set(songSelect)
	updateDisplay()
}, { lazy: true })

MCFunction('sections/rhythm/leaderboard/tick', () => {
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

	scrollTimer.add(1)
	_.if(scrollTimer.greaterOrEqualThan(SCROLL_SPEED), () => {
		scrollTimer.set(0)
		scrollPos.add(1)
		scrollLbUpdate()
	})
}, { runEveryTick: true })

MCFunction('sections/rhythm/leaderboard/init', () => {
	lbSongView.set(0)
	lbCatView.set(0)
	scrollPos.set(0)
	scrollTimer.set(0)

	for (let i = 0; i < songCount; i++) {
		const name = songNames[i]
		scoreboard.objectives.modify(`rlb.s${i}`).displayname([
			{ text: '♪ ', color: 'gold' },
			{ text: name, color: 'yellow' },
			{ text: ' - Best', color: 'white' },
		])
		scoreboard.objectives.modify(`rlb.s${i}d`).displayname([
			{ text: '♪ ', color: 'gold' },
			{ text: name, color: 'yellow' },
			{ text: ' - Deathless', color: 'light_purple' },
		])
	}

	updateDisplay()
}, { runOnLoad: true })

MCFunction('sections/rhythm/leaderboard/spawn', () => {
	execute.in(DIM).run(() => {
		kill(Selector('@e', { tag: T.UI_LEADERBOARD }))

		spawnPanel(P,
			[T.UI_LEADERBOARD, T.UI_LB_TXT],
			lbText(0, 0), 0)

		const btnY = lineY(P, TOTAL_LINES, 13)
		spawnClick(P, -0.75, btnY, [T.UI_LEADERBOARD, T.UI_LB_SONG_INT], 1)
		spawnClick(P, 0.75, btnY, [T.UI_LEADERBOARD, T.UI_LB_CAT_INT], 1)

		const myY = lineY(P, TOTAL_LINES, 14)
		spawnClick(P, 0, myY, [T.UI_LEADERBOARD, T.UI_LB_MY_INT], 1)
	})
}, { runOnLoad: true })
