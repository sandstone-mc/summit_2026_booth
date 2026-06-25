import { _, advancement, Advancement, data, execute, MCFunction, playsound, Selector, kill, tag } from 'sandstone'
import { songCount, songNames } from '../config/songs'
import { mapCount, mapNames } from '../config/maps'
import { SETTINGS, PADDING, MAX_NAME_LEN, RULER, SCROLL_SPEED } from '../config/panels'
import { GameStatus, Tags, status, songSelect, mapSelect } from './state'
import { startGame, cancelStart } from './start'
import { placeMap, clearMap, spawnSkybox } from './arena-map'
import { spawnPanel, spawnClick, lineY, clampName, needsScroll, scrollFrame, scrollFrameCount } from '../hologram'
import { DIM, NAMESPACE, state } from '../../../shared'

export const livesOptions = [1, 3, 5] as const
export const livesSetting = state('$lives')
const livesIdx = state('$lives_idx')

const T = Tags
const TOTAL_LINES = 10

const panelSel = Selector('@e', { tag: T.UI_SETTINGS_TXT, limit: 1 })

const scrollPos = state('$scroll_set')
const scrollTimer = state('$scroll_t')

function clampLives(livesI: number): string {
	const hearts = '❤'.repeat(livesOptions[livesI])
	const val = `${hearts} ${livesOptions[livesI]}`
	if (val.length < MAX_NAME_LEN) {
		const total = MAX_NAME_LEN - val.length
		const left = Math.floor(total / 2)
		const right = total - left
		return ' '.repeat(left) + val + ' '.repeat(right)
	}
	return val
}

function settingsText(songIdx: number, livesI: number, mapIdx: number, cancel: boolean, songNameOverride?: string): any[] {
	const P = PADDING
	const sName = songNameOverride ?? clampName(songNames[songIdx] ?? 'None')
	const mName = mapCount > 0 ? clampName(mapNames[mapIdx] ?? 'None') : clampName('No maps')
	const lName = clampLives(livesI)
	return [
		{ text: `${P}⚙ `, color: 'gray' }, { text: `SETTINGS${P}`, color: 'white', bold: true },
		{ text: '\n\n' },
		{ text: `${P}♪ Song: `, color: 'gray' }, { text: `${sName}${P}`, color: 'aqua', font: 'monocraft:default' },
		{ text: '\n\n' },
		{ text: `${P}  Lives: `, color: 'gray' }, { text: `${lName}${P}`, color: 'red', font: 'monocraft:default' },
		{ text: '\n\n' },
		{ text: `${P}🗺 Map: `, color: 'gray' }, { text: `${mName}${P}`, color: 'green', font: 'monocraft:default' },
		{ text: '\n\n\n' },
		cancel
			? { text: `${P}✖ CANCEL${P}`, color: 'red', bold: true }
			: { text: `${P}▶ START${P}`, color: 'green', bold: true },
		{ text: `\n${RULER}` },
	]
}

const mapMax = Math.max(mapCount, 1)

function inProgressText(): any[] {
	const P = PADDING
	return [
		{ text: `${P}⚙ `, color: 'gray' }, { text: `SETTINGS${P}`, color: 'white', bold: true },
		{ text: '\n\n\n\n' },
		{ text: `${P}🎵 Match in progress${P}`, color: 'gold', bold: true },
		{ text: `\n\n\n\n\n\n${RULER}` },
	]
}

export const updateSettingsPanel = MCFunction('sections/rhythm/settings/update', () => {
	scrollPos.set(0)
	scrollTimer.set(0)
	_.if(status.greaterOrEqualThan(GameStatus.ACTIVE), () => {
		data.merge.entity(panelSel, { text: inProgressText() })
	}).else(() => {
		for (let si = 0; si < songCount; si++) {
			_.if(songSelect.equalTo(si), () => {
				for (let li = 0; li < livesOptions.length; li++) {
					_.if(livesIdx.equalTo(li), () => {
						for (let mi = 0; mi < mapMax; mi++) {
							_.if(mapSelect.equalTo(mi), () => {
								_.if(status.equalTo(GameStatus.STARTING), () => {
									data.merge.entity(panelSel, { text: settingsText(si, li, mi, true) })
								}).else(() => {
									data.merge.entity(panelSel, { text: settingsText(si, li, mi, false) })
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
			_.if(scrollPos.greaterOrEqualThan(frames), () => {
				scrollPos.set(0)
			})
			for (let offset = 0; offset < frames; offset++) {
				_.if(scrollPos.equalTo(offset), () => {
					const visible = scrollFrame(name, offset)
					for (let li = 0; li < livesOptions.length; li++) {
						_.if(livesIdx.equalTo(li), () => {
							for (let mi = 0; mi < mapMax; mi++) {
								_.if(mapSelect.equalTo(mi), () => {
									_.if(status.equalTo(GameStatus.STARTING), () => {
										data.merge.entity(panelSel, { text: settingsText(si, li, mi, true, visible) })
									}).else(() => {
										data.merge.entity(panelSel, { text: settingsText(si, li, mi, false, visible) })
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
				entity: { type: 'minecraft:interaction', nbt: `{Tags:["${T.UI_SONG_INT}"]}` },
			},
		},
	},
})

Advancement('ui_lives_cycle', {
	criteria: {
		click: {
			trigger: 'minecraft:player_interacted_with_entity',
			conditions: {
				entity: { type: 'minecraft:interaction', nbt: `{Tags:["${T.UI_LIVES_INT}"]}` },
			},
		},
	},
})

Advancement('ui_map_cycle', {
	criteria: {
		click: {
			trigger: 'minecraft:player_interacted_with_entity',
			conditions: {
				entity: { type: 'minecraft:interaction', nbt: `{Tags:["${T.UI_MAP_INT}"]}` },
			},
		},
	},
})

Advancement('ui_start_game', {
	criteria: {
		click: {
			trigger: 'minecraft:player_interacted_with_entity',
			conditions: {
				entity: { type: 'minecraft:interaction', nbt: `{Tags:["${T.UI_START_INT}"]}` },
			},
		},
	},
})

const onSongCycle = MCFunction('sections/rhythm/settings/on_song', () => {
	_.if(status.equalTo(GameStatus.WAITING), () => {
		songSelect.add(1)
		_.if(songSelect.greaterOrEqualThan(songCount), () => {
			songSelect.set(0)
		})
		updateSettingsPanel()
		execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
	})
}, { lazy: true })

const onLivesCycle = MCFunction('sections/rhythm/settings/on_lives', () => {
	_.if(status.equalTo(GameStatus.WAITING), () => {
		livesIdx.add(1)
		_.if(livesIdx.greaterOrEqualThan(livesOptions.length), () => {
			livesIdx.set(0)
		})
		for (let i = 0; i < livesOptions.length; i++) {
			const idx = i
			_.if(livesIdx.equalTo(idx), () => {
				livesSetting.set(livesOptions[idx])
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
			_.if(mapSelect.greaterOrEqualThan(mapCount), () => {
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
	_.if(scrollTimer.greaterOrEqualThan(SCROLL_SPEED), () => {
		scrollTimer.set(0)
		scrollPos.add(1)
		scrollSettingsUpdate()
	})
}, { runEveryTick: true })

MCFunction('sections/rhythm/settings/init', () => {
	livesSetting.set(3)
	livesIdx.set(1)
	mapSelect.set(0)
	scrollPos.set(0)
	scrollTimer.set(0)
}, { runOnLoad: true })

MCFunction('sections/rhythm/settings/load_map', () => {
	placeMap()
}, { runOnLoad: true })

MCFunction('sections/rhythm/settings/spawn', () => {
	execute.in(DIM).run(() => {
		kill(Selector('@e', { tag: T.UI_SETTINGS }))

		spawnPanel(SETTINGS,
			[T.UI_SETTINGS, T.UI_SETTINGS_TXT],
			settingsText(0, 1, 0, false), 0)

		const songY = lineY(SETTINGS, TOTAL_LINES, 2)
		spawnClick(SETTINGS, 0, songY, [T.UI_SETTINGS, T.UI_SONG_INT], 1)

		const livesY = lineY(SETTINGS, TOTAL_LINES, 4)
		spawnClick(SETTINGS, 0, livesY, [T.UI_SETTINGS, T.UI_LIVES_INT], 1)

		const mapY = lineY(SETTINGS, TOTAL_LINES, 6)
		spawnClick(SETTINGS, 0, mapY, [T.UI_SETTINGS, T.UI_MAP_INT], 1)

		const startY = lineY(SETTINGS, TOTAL_LINES, 9)
		spawnClick(SETTINGS, 0, startY, [T.UI_SETTINGS, T.UI_START_INT], 1)
	})
}, { runOnLoad: true })
