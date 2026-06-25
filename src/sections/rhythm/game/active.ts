import { _, abs, attribute, effect, execute, forceload, gamemode, gamerule, MCFunction, NBT, Objective, playsound, Selector, tag, team, title, tp } from 'sandstone'
import { arena } from '../config/arena'
import { songCount, songDurations } from '../config/songs'
import { GameStatus, allPlayers, alivePlayers, status, songSelect } from './state'
import { wallLives } from './walls/collision'
import { points, combo, finalScore } from './scoring'
import { livesSetting, updateSettingsPanel } from './settings'
import { playSong, scheduleWalls } from './songs'
import { spawnLaneShulkers, spawnLaneBorder } from './lane-effects'
import { DIM, state } from '../../../shared'

MCFunction('sections/rhythm/active/nocollide_init', () => {
	team.add('ssb.rhythm.nocollide')
	team.modify('ssb.rhythm.nocollide', 'collisionRule', 'never')
	team.modify('ssb.rhythm.nocollide', 'seeFriendlyInvisibles', false)
}, { runOnLoad: true })

export const timer = state('$timer')

MCFunction('sections/rhythm/active/forceload', () => {
	execute.in(DIM).run(() => {
		const [fxMin, fzMin] = arena.forceloadMin
		const [fxMax, fzMax] = arena.forceloadMax
		forceload.add(abs(fxMin, fzMin), abs(fxMax, fzMax))
	})
}, { runOnLoad: true })

export const setActive = MCFunction('sections/rhythm/active/init', () => {
	status.set(GameStatus.ACTIVE)

	execute.in(DIM).run(() => {
		const [x, y, z] = arena.playerSpawn
		tp(allPlayers, abs(x, y, z), [`${arena.playerYaw}`, '0'])
	})

	gamemode('adventure', allPlayers)
	team.join('ssb.rhythm.nocollide', allPlayers)

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

	gamerule('natural_health_regeneration', false)

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
