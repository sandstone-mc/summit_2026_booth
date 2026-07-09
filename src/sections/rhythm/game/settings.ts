import {
	_,
	advancement,
	type Score,
	Variable,
	Advancement,
	data,
	execute,
	MCFunction,
	type MCFunctionClass,
	Selector,
	kill,
	tag,
} from 'sandstone'
import { type JSONTextComponent } from 'sandstone/arguments'
import { songCount, songNames } from '@rhythm/config/internal/songs'
import { mapCount, mapNames } from '@rhythm/config/internal/maps'
import { gameplay } from '@rhythm/config'
import { panels } from '@rhythm/config/internal/derived'
import { GameStatus, Tags, status, songSelect, mapSelect } from './state'
import { startGame, cancelStart } from './start'
import { placeMap } from './arena-map'
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

export const livesSetting = Variable(gameplay.lives.default)

// the panel renders 11 lines; TOTAL_LINES=10 + CLICK_Y_OFFSET is the calibrated click grid
const RENDER_LINES = 11
const SONG_LINE = 2
const LIVES_LINE = 4
const MAP_LINE = 6
const BUTTON_LINE = 9

const TOTAL_LINES = 10
const CLICK_WIDTH = 3
const CLICK_Y_OFFSET = 0.25

const songLineSel = Selector('@e', { tag: Tags.UI_SET_SONG_TXT, limit: 1 })
const livesLineSel = Selector('@e', { tag: Tags.UI_SET_LIVES_TXT, limit: 1 })
const mapLineSel = Selector('@e', { tag: Tags.UI_SET_MAP_TXT, limit: 1 })
const buttonLineSel = Selector('@e', { tag: Tags.UI_SET_BTN_TXT, limit: 1 })

const scrollPos = Variable(0)

const BLANK_LINE: JSONTextComponent = { text: ' ' }

function songLineText(name: string): JSONTextComponent {
	return [
		{ text: `${panels.padding}♪ Song: `, color: 'gray' },
		{ text: `${name}${panels.padding}`, color: 'aqua', font: 'monocraft:default' },
	]
}

function livesLineText(lives: number): JSONTextComponent {
	return [
		{ text: `${panels.padding}  Lives: `, color: 'gray' },
		{ text: `${clampName(`${'❤'.repeat(lives)} ${lives}`)}${panels.padding}`, color: 'red', font: 'monocraft:default' },
	]
}

function mapLineText(mapI: number): JSONTextComponent {
	const name = mapCount > 0 ? clampName(mapNames[mapI] ?? 'None') : clampName('No maps')
	return [
		{ text: `${panels.padding}🗺 Map: `, color: 'gray' },
		{ text: `${name}${panels.padding}`, color: 'green', font: 'monocraft:default' },
	]
}

const START_TEXT: JSONTextComponent = { text: `${panels.padding}▶ START${panels.padding}`, color: 'green', bold: true }
const CANCEL_TEXT: JSONTextComponent = { text: `${panels.padding}✖ CANCEL${panels.padding}`, color: 'red', bold: true }
const IN_PROGRESS_TEXT: JSONTextComponent = [
	{ text: `${panels.padding}🎵 `, color: 'gold', bold: true },
	{ text: `${clampName('Match in progress')}${panels.padding}`, color: 'gold', bold: true, font: 'monocraft:default' },
]

function dispatch(selectScore: Score, count: number, render: (i: number) => void) {
	if (count === 0) return
	if (count === 1) {
		render(0)
		return
	}
	_.switch(
		selectScore,
		Array.from({ length: count }, (_v, i) => ['case', i, () => render(i)] as const),
	)
}

const scrollingSongs = Array.from({ length: songCount }, (_v, i) => i).filter((i) => needsScroll(songNames[i]))

const updateSongLine = MCFunction(
	'sections/rhythm/settings/song_line',
	() => {
		dispatch(songSelect, songCount, (songI) => {
			mergeDisplayText(songLineSel, songLineText(clampName(songNames[songI] ?? 'None')))
			if (scrollingSongs.includes(songI)) {
				scrollLoop.schedule.function(`${panels.scrollSpeed}t`, 'replace')
			}
		})
	},
	{ lazy: true },
)

const updateLivesLine = MCFunction(
	'sections/rhythm/settings/lives_line',
	() => {
		_.switch(
			livesSetting,
			Array.from(
				{ length: gameplay.lives.max - gameplay.lives.min + 1 },
				(_v, i) =>
					[
						'case',
						gameplay.lives.min + i,
						() => mergeDisplayText(livesLineSel, livesLineText(gameplay.lives.min + i)),
					] as const,
			),
		)
	},
	{ lazy: true },
)

const updateMapLine = MCFunction(
	'sections/rhythm/settings/map_line',
	() => {
		dispatch(mapSelect, Math.max(mapCount, 1), (mapI) => {
			mergeDisplayText(mapLineSel, mapLineText(mapI))
		})
	},
	{ lazy: true },
)

export const updateSettingsPanel = MCFunction(
	'sections/rhythm/settings/update',
	() => {
		scrollPos.set(0)
		_.if(status.greaterThanOrEqualTo(GameStatus.ACTIVE), () => {
			scrollLoop.schedule.clear()
			mergeDisplayText(songLineSel, BLANK_LINE)
			mergeDisplayText(livesLineSel, IN_PROGRESS_TEXT)
			mergeDisplayText(mapLineSel, BLANK_LINE)
			mergeDisplayText(buttonLineSel, BLANK_LINE)
		}).else(() => {
			updateSongLine()
			updateLivesLine()
			updateMapLine()
			_.if(status.equalTo(GameStatus.STARTING), () => {
				mergeDisplayText(buttonLineSel, CANCEL_TEXT)
			}).else(() => {
				mergeDisplayText(buttonLineSel, START_TEXT)
			})
		})
	},
	{ lazy: true },
)

const scrollSettingsUpdate = MCFunction(
	'sections/rhythm/settings/scroll',
	() => {
		for (const songI of scrollingSongs) {
			const name = songNames[songI]
			_.if(songSelect.equalTo(songI), () => {
				const frames = scrollFrameCount(name)
				_.if(scrollPos.greaterThanOrEqualTo(frames), () => {
					scrollPos.set(0)
				})
				for (let offset = 0; offset < frames; offset++) {
					_.if(scrollPos.equalTo(offset), () => {
						mergeDisplayText(songLineSel, songLineText(scrollFrame(name, offset)))
					})
				}
			})
		}
	},
	{ lazy: true },
)

// runs only while a long song name is on the panel; dies on its own otherwise
const scrollLoop = MCFunction(
	'sections/rhythm/settings/scroll_loop',
	(self: MCFunctionClass) => {
		scrollPos.add(1)
		scrollSettingsUpdate()
		_.if(status.lessThan(GameStatus.ACTIVE), () => {
			for (const songI of scrollingSongs) {
				_.if(songSelect.equalTo(songI), () => {
					self.schedule.function(`${panels.scrollSpeed}t`, 'replace')
				})
			}
		})
	},
	{ lazy: true },
)

Advancement('ui_song_cycle', {
	criteria: {
		click: {
			trigger: 'minecraft:player_interacted_with_entity',
			conditions: {
				entity: { entity_type: 'minecraft:interaction', nbt: `{Tags:["${Tags.UI_SONG_INT}"]}` },
			},
		},
	},
})

Advancement('ui_lives_cycle', {
	criteria: {
		click: {
			trigger: 'minecraft:player_interacted_with_entity',
			conditions: {
				entity: { entity_type: 'minecraft:interaction', nbt: `{Tags:["${Tags.UI_LIVES_INT}"]}` },
			},
		},
	},
})

Advancement('ui_map_cycle', {
	criteria: {
		click: {
			trigger: 'minecraft:player_interacted_with_entity',
			conditions: {
				entity: { entity_type: 'minecraft:interaction', nbt: `{Tags:["${Tags.UI_MAP_INT}"]}` },
			},
		},
	},
})

Advancement('ui_start_game', {
	criteria: {
		click: {
			trigger: 'minecraft:player_interacted_with_entity',
			conditions: {
				entity: { entity_type: 'minecraft:interaction', nbt: `{Tags:["${Tags.UI_START_INT}"]}` },
			},
		},
	},
})

const onSongCycle = MCFunction(
	'sections/rhythm/settings/on_song',
	() => {
		_.if(status.equalTo(GameStatus.WAITING), () => {
			songSelect.add(1)
			_.if(songSelect.greaterThanOrEqualTo(songCount), () => {
				songSelect.set(0)
			})
			scrollPos.set(0)
			updateSongLine()
			execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
		})
	},
	{ lazy: true },
)

const onLivesCycle = MCFunction(
	'sections/rhythm/settings/on_lives',
	() => {
		_.if(status.equalTo(GameStatus.WAITING), () => {
			livesSetting.add(1)
			_.if(livesSetting.greaterThan(gameplay.lives.max), () => {
				livesSetting.set(gameplay.lives.min)
			})
			updateLivesLine()
			execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
		})
	},
	{ lazy: true },
)

const onMapCycle = MCFunction(
	'sections/rhythm/settings/on_map',
	() => {
		_.if(status.equalTo(GameStatus.WAITING), () => {
			if (mapCount > 0) {
				mapSelect.add(1)
				_.if(mapSelect.greaterThanOrEqualTo(mapCount), () => {
					mapSelect.set(0)
				})
				placeMap()
			}
			updateMapLine()
			execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
		})
	},
	{ lazy: true },
)

const onStartGame = MCFunction(
	'sections/rhythm/settings/on_start',
	() => {
		_.if(status.equalTo(GameStatus.WAITING), () => {
			tag('@s').add(Tags.PLAYER)
			startGame()
			updateSettingsPanel()
		}).elseIf(status.equalTo(GameStatus.STARTING), () => {
			cancelStart()
			updateSettingsPanel()
		})
		execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
	},
	{ lazy: true },
)

const onSongCycleBack = MCFunction(
	'sections/rhythm/settings/on_song_back',
	() => {
		_.if(status.equalTo(GameStatus.WAITING), () => {
			songSelect.remove(1)
			_.if(songSelect.lessThan(0), () => {
				songSelect.set(Math.max(songCount - 1, 0))
			})
			scrollPos.set(0)
			updateSongLine()
			execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
		})
	},
	{ lazy: true },
)

const onLivesCycleBack = MCFunction(
	'sections/rhythm/settings/on_lives_back',
	() => {
		_.if(status.equalTo(GameStatus.WAITING), () => {
			livesSetting.remove(1)
			_.if(livesSetting.lessThan(gameplay.lives.min), () => {
				livesSetting.set(gameplay.lives.max)
			})
			updateLivesLine()
			execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
		})
	},
	{ lazy: true },
)

const onMapCycleBack = MCFunction(
	'sections/rhythm/settings/on_map_back',
	() => {
		_.if(status.equalTo(GameStatus.WAITING), () => {
			if (mapCount > 0) {
				mapSelect.remove(1)
				_.if(mapSelect.lessThan(0), () => {
					mapSelect.set(mapCount - 1)
				})
				placeMap()
			}
			updateMapLine()
			execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
		})
	},
	{ lazy: true },
)

// left click on a cycle button steps backwards: the interaction records the attack in nbt
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

export const settingsTick = MCFunction(
	'sections/rhythm/settings/tick',
	() => {
		onAttack(Tags.UI_SONG_INT, () => onSongCycleBack())
		onAttack(Tags.UI_LIVES_INT, () => onLivesCycleBack())
		onAttack(Tags.UI_MAP_INT, () => onMapCycleBack())
		execute.as(Selector('@a', { advancements: { [`${NAMESPACE}:ui_song_cycle`]: true } })).run(() => {
			onSongCycle()
			advancement.revoke('@s').only(`${NAMESPACE}:ui_song_cycle`)
		})
		execute.as(Selector('@a', { advancements: { [`${NAMESPACE}:ui_lives_cycle`]: true } })).run(() => {
			onLivesCycle()
			advancement.revoke('@s').only(`${NAMESPACE}:ui_lives_cycle`)
		})
		execute.as(Selector('@a', { advancements: { [`${NAMESPACE}:ui_map_cycle`]: true } })).run(() => {
			onMapCycle()
			advancement.revoke('@s').only(`${NAMESPACE}:ui_map_cycle`)
		})
		execute.as(Selector('@a', { advancements: { [`${NAMESPACE}:ui_start_game`]: true } })).run(() => {
			onStartGame()
			advancement.revoke('@s').only(`${NAMESPACE}:ui_start_game`)
		})
	},
	{ lazy: true },
)

// no longer load map on reload
// MCFunction(
// 	'sections/rhythm/settings/load_map',
// 	() => {
// 		placeMap()
// 	},
// 	{ runOnLoad: true },
// )

const BACKDROP_TEXT: JSONTextComponent = [
	{ text: `SETTINGS${panels.padding}`, color: 'white', bold: true },
	{ text: `\n\n\n\n\n\n\n\n\n\n${panels.ruler}` },
]

export const spawnSettingsPanel = MCFunction(
	'sections/rhythm/settings/spawn',
	() => {
		kill(Selector('@e', { tag: Tags.UI_SETTINGS }))

		spawnPanel(panels.settings, [Tags.UI_SETTINGS, Tags.UI_SETTINGS_TXT], BACKDROP_TEXT, 0)
		spawnPanelLines(panels.settings, [Tags.UI_SETTINGS, Tags.UI_SET_SONG_TXT], RENDER_LINES, SONG_LINE)
		spawnPanelLines(panels.settings, [Tags.UI_SETTINGS, Tags.UI_SET_LIVES_TXT], RENDER_LINES, LIVES_LINE)
		spawnPanelLines(panels.settings, [Tags.UI_SETTINGS, Tags.UI_SET_MAP_TXT], RENDER_LINES, MAP_LINE)
		spawnPanelLines(panels.settings, [Tags.UI_SETTINGS, Tags.UI_SET_BTN_TXT], RENDER_LINES, BUTTON_LINE)
		updateSettingsPanel()

		const songY = lineY(panels.settings, TOTAL_LINES, 2)
		spawnClick(panels.settings, 0, songY, [Tags.UI_SETTINGS, Tags.UI_SONG_INT], CLICK_WIDTH, CLICK_Y_OFFSET)

		const livesY = lineY(panels.settings, TOTAL_LINES, 4)
		spawnClick(panels.settings, 0, livesY, [Tags.UI_SETTINGS, Tags.UI_LIVES_INT], CLICK_WIDTH, CLICK_Y_OFFSET)

		const mapY = lineY(panels.settings, TOTAL_LINES, 6)
		spawnClick(panels.settings, 0, mapY, [Tags.UI_SETTINGS, Tags.UI_MAP_INT], CLICK_WIDTH, CLICK_Y_OFFSET)

		const startY = lineY(panels.settings, TOTAL_LINES, 9)
		spawnClick(panels.settings, 0, startY, [Tags.UI_SETTINGS, Tags.UI_START_INT], CLICK_WIDTH, CLICK_Y_OFFSET)
	},
	{ lazy: true },
)
