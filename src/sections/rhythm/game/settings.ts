import { _, advancement, Advancement, execute, MCFunction, Selector, kill, tag } from 'sandstone'
import { type JSONTextComponent } from 'sandstone/arguments'
import { songCount, songNames } from '@rhythm/config/internal/songs'
import { mapCount, mapNames } from '@rhythm/config/internal/maps'
import { gameplay } from '@rhythm/config'
import { panels } from '@rhythm/config/internal/derived'
import { GameStatus, Tags, status, songSelect, mapSelect } from './state'
import { startGame, cancelStart } from './start'
import { placeMap, clearMap } from './arena-map'
import { spawnPanel, spawnClick, lineY, clampName, needsScroll, scrollFrame, scrollFrameCount, mergeDisplayText } from '@rhythm/hologram'
import { DIMENSION, NAMESPACE, state } from '@shared'

export const livesSetting = state('$lives')
const livesIdx = state('$lives_idx')

const TOTAL_LINES = 10
const CLICK_WIDTH = 3
const CLICK_Y_OFFSET = 0.25

const panelSel = Selector('@e', { tag: Tags.UI_SETTINGS_TXT, limit: 1 })

const scrollPos = state('$scroll_set')
const scrollTimer = state('$scroll_t')

function clampLives(livesI: number): string {
	const hearts = '❤'.repeat(gameplay.lives.options[livesI])
	const val = `${hearts} ${gameplay.lives.options[livesI]}`
	if (val.length < panels.maxNameLength) {
		const total = panels.maxNameLength - val.length
		const left = Math.floor(total / 2)
		const right = total - left
		return ' '.repeat(left) + val + ' '.repeat(right)
	}
	return val
}

function settingsText(songIdx: number, livesI: number, mapIdx: number, cancel: boolean, songNameOverride?: string): JSONTextComponent[] {
	const sName = songNameOverride ?? clampName(songNames[songIdx] ?? 'None')
	const mName = mapCount > 0 ? clampName(mapNames[mapIdx] ?? 'None') : clampName('No maps')
	const lName = clampLives(livesI)
	return [
		{ text: `SETTINGS${panels.padding}`, color: 'white', bold: true },
		{ text: '\n\n' },
		{ text: `${panels.padding}♪ Song: `, color: 'gray' }, { text: `${sName}${panels.padding}`, color: 'aqua', font: 'monocraft:default' },
		{ text: '\n\n' },
		{ text: `${panels.padding}  Lives: `, color: 'gray' }, { text: `${lName}${panels.padding}`, color: 'red', font: 'monocraft:default' },
		{ text: '\n\n' },
		{ text: `${panels.padding}🗺 Map: `, color: 'gray' }, { text: `${mName}${panels.padding}`, color: 'green', font: 'monocraft:default' },
		{ text: '\n\n\n' },
		cancel
			? { text: `${panels.padding}✖ CANCEL${panels.padding}`, color: 'red', bold: true }
			: { text: `${panels.padding}▶ START${panels.padding}`, color: 'green', bold: true },
		{ text: `\n${panels.ruler}` },
	]
}

const mapMax = Math.max(mapCount, 1)

function inProgressText(): JSONTextComponent[] {
	return [
		{ text: `SETTINGS${panels.padding}`, color: 'white', bold: true },
		{ text: '\n\n\n\n' },
		{ text: `${panels.padding}🎵 Match in progress${panels.padding}`, color: 'gold', bold: true },
		{ text: `\n\n\n\n\n\n${panels.ruler}` },
	]
}

export const updateSettingsPanel = MCFunction('sections/rhythm/settings/update', () => {
	scrollPos.set(0)
	scrollTimer.set(0)
	_.if(status.greaterThanOrEqualTo(GameStatus.ACTIVE), () => {
		mergeDisplayText(panelSel, inProgressText())
	}).else(() => {
		for (let si = 0; si < songCount; si++) {
			_.if(songSelect.equalTo(si), () => {
				for (let li = 0; li < gameplay.lives.options.length; li++) {
					_.if(livesIdx.equalTo(li), () => {
						for (let mi = 0; mi < mapMax; mi++) {
							_.if(mapSelect.equalTo(mi), () => {
								_.if(status.equalTo(GameStatus.STARTING), () => {
									mergeDisplayText(panelSel, settingsText(si, li, mi, true))
								}).else(() => {
									mergeDisplayText(panelSel, settingsText(si, li, mi, false))
								})
							})
						}
					})
				}
			})
		}
	})
}, { lazy: true })

const scrollSettingsUpdate = MCFunction('sections/rhythm/settings/scroll', () => {
	for (let si = 0; si < songCount; si++) {
		const name = songNames[si]
		if (!needsScroll(name)) continue
		_.if(songSelect.equalTo(si), () => {
			const frames = scrollFrameCount(name)
			_.if(scrollPos.greaterThanOrEqualTo(frames), () => {
				scrollPos.set(0)
			})
			for (let offset = 0; offset < frames; offset++) {
				_.if(scrollPos.equalTo(offset), () => {
					const visible = scrollFrame(name, offset)
					for (let li = 0; li < gameplay.lives.options.length; li++) {
						_.if(livesIdx.equalTo(li), () => {
							for (let mi = 0; mi < mapMax; mi++) {
								_.if(mapSelect.equalTo(mi), () => {
									_.if(status.equalTo(GameStatus.STARTING), () => {
										mergeDisplayText(panelSel, settingsText(si, li, mi, true, visible))
									}).else(() => {
										mergeDisplayText(panelSel, settingsText(si, li, mi, false, visible))
									})
								})
							}
						})
					}
				})
			}
		})
	}
}, { lazy: true })

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

const onSongCycle = MCFunction('sections/rhythm/settings/on_song', () => {
	_.if(status.equalTo(GameStatus.WAITING), () => {
		songSelect.add(1)
		_.if(songSelect.greaterThanOrEqualTo(songCount), () => {
			songSelect.set(0)
		})
		updateSettingsPanel()
		execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
	})
}, { lazy: true })

const onLivesCycle = MCFunction('sections/rhythm/settings/on_lives', () => {
	_.if(status.equalTo(GameStatus.WAITING), () => {
		livesIdx.add(1)
		_.if(livesIdx.greaterThanOrEqualTo(gameplay.lives.options.length), () => {
			livesIdx.set(0)
		})
		for (let i = 0; i < gameplay.lives.options.length; i++) {
			const idx = i
			_.if(livesIdx.equalTo(idx), () => {
				livesSetting.set(gameplay.lives.options[idx])
			})
		}
		updateSettingsPanel()
		execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
	})
}, { lazy: true })

const onMapCycle = MCFunction('sections/rhythm/settings/on_map', () => {
	_.if(status.equalTo(GameStatus.WAITING), () => {
		if (mapCount > 0) {
			clearMap()
			mapSelect.add(1)
			_.if(mapSelect.greaterThanOrEqualTo(mapCount), () => {
				mapSelect.set(0)
			})
			placeMap()
		}
		updateSettingsPanel()
		execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
	})
}, { lazy: true })

const onStartGame = MCFunction('sections/rhythm/settings/on_start', () => {
	_.if(status.equalTo(GameStatus.WAITING), () => {
		tag('@s').add(Tags.PLAYER)
		tag('@s').add(Tags.ALIVE)
		startGame()
		updateSettingsPanel()
	}).elseIf(status.equalTo(GameStatus.STARTING), () => {
		cancelStart()
		tag('@s').remove(Tags.PLAYER)
		tag('@s').remove(Tags.ALIVE)
		updateSettingsPanel()
	})
	execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
}, { lazy: true })

MCFunction('sections/rhythm/settings/tick', () => {
	// TODO: Look into optimizing this, also use x/y/z selector
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

	scrollTimer.add(1)
	_.if(scrollTimer.greaterThanOrEqualTo(panels.scrollSpeed), () => {
		scrollTimer.set(0)
		scrollPos.add(1)
		scrollSettingsUpdate()
	})
}, { runEveryTick: true })

MCFunction('sections/rhythm/settings/init', () => {
	livesSetting.set(gameplay.lives.default)
	livesIdx.set(gameplay.lives.options.indexOf(gameplay.lives.default))
	mapSelect.set(0)
	scrollPos.set(0)
	scrollTimer.set(0)
}, { runOnLoad: true })

MCFunction('sections/rhythm/settings/load_map', () => {
	placeMap()
}, { runOnLoad: true })

MCFunction('sections/rhythm/settings/spawn', () => {
	execute.in(DIMENSION).run(() => {
		kill(Selector('@e', { tag: Tags.UI_SETTINGS }))

		spawnPanel(panels.settings,
			[Tags.UI_SETTINGS, Tags.UI_SETTINGS_TXT],
			settingsText(0, 1, 0, false), 0)

		const songY = lineY(panels.settings, TOTAL_LINES, 2)
		spawnClick(panels.settings, 0, songY, [Tags.UI_SETTINGS, Tags.UI_SONG_INT], CLICK_WIDTH, CLICK_Y_OFFSET)

		const livesY = lineY(panels.settings, TOTAL_LINES, 4)
		spawnClick(panels.settings, 0, livesY, [Tags.UI_SETTINGS, Tags.UI_LIVES_INT], CLICK_WIDTH, CLICK_Y_OFFSET)

		const mapY = lineY(panels.settings, TOTAL_LINES, 6)
		spawnClick(panels.settings, 0, mapY, [Tags.UI_SETTINGS, Tags.UI_MAP_INT], CLICK_WIDTH, CLICK_Y_OFFSET)

		const startY = lineY(panels.settings, TOTAL_LINES, 9)
		spawnClick(panels.settings, 0, startY, [Tags.UI_SETTINGS, Tags.UI_START_INT], CLICK_WIDTH, CLICK_Y_OFFSET)
	})
}, { runOnLoad: true })
