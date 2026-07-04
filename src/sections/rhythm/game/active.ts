import { _, abs, attribute, effect, execute, forceload, gamemode, gamerule, MCFunction, team, tp } from 'sandstone'
import { arena } from '@rhythm/config/internal/arena'
import { songCount, songDurations } from '@rhythm/config/internal/songs'
import { GameStatus, Tags, allPlayers, status, songSelect } from './state'
import { wallLives } from './walls/collision'
import { points, combo, finalScore } from './scoring'
import { livesSetting, updateSettingsPanel } from './settings'
import { playSong, scheduleWalls } from './songs'
import { spawnLaneShulkers, spawnLaneBorder } from './lane-effects'
import { DIMENSION, state } from '@shared'

export const timer = state('$timer')

MCFunction('sections/rhythm/active/forceload', () => {
	execute.in(DIMENSION).run(() => {
		const [fxMin, fzMin] = arena.forceloadMin
		const [fxMax, fzMax] = arena.forceloadMax
		forceload.add(abs(fxMin, fzMin), abs(fxMax, fzMax))
	})
}, { runOnLoad: true })

export const setActive = MCFunction('sections/rhythm/active/init', () => {
	status.set(GameStatus.ACTIVE)

	execute.in(DIMENSION).run(() => {
		const [x, y, z] = arena.playerSpawn
		tp(allPlayers, abs(x, y, z), [`${arena.playerYaw}`, '0'])
	})

	execute.as(allPlayers).run(() => {
		attribute("@s", "minecraft:fall_damage_multiplier").baseSet(0)
		attribute('@s', 'minecraft:movement_speed').baseSet(0.1)
		wallLives('@s').set(livesSetting)
		effect.give('@s', 'minecraft:instant_health', 1, 126, true)
		effect.give('@s', 'minecraft:saturation', 99999, 0, true)
		points('@s').set(0)
		combo('@s').set(0)
		finalScore('@s').set(0)
	})

	if (songCount === 1) {
		timer.set(songDurations[0] * 20)
	} else {
		let chain = _.if(songSelect.equalTo(0), () => { timer.set(songDurations[0] * 20) })
		for (let i = 1; i < songCount; i++) {
			const idx = i
			chain = chain.elseIf(songSelect.equalTo(idx), () => { timer.set(songDurations[idx] * 20) })
		}
	}

	spawnLaneShulkers()
	spawnLaneBorder()
	playSong()
	scheduleWalls()
	updateSettingsPanel()

	execute.as(allPlayers).at('@s').run.playsound('minecraft:entity.player.levelup', 'master', '@s')
}, { lazy: true })
