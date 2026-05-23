import { _, abs, attribute, effect, execute, forceload, gamemode, gamerule, MCFunction, NBT, Objective, playsound, Selector, tag, team, title, tp } from 'sandstone'
import { arena } from '../config/arena'
import { songCount, songDurations } from '../config/songs'
import { GameState, allPlayers, alivePlayers, gameState, songScore, livesDefault } from './state'
import { wallLives } from './walls/collision'
import { points, combo, finalScore } from './scoring'
import { playSong, scheduleWalls } from './songs'
import { DIM } from '../../../shared'

MCFunction('sections/rythm/active/nocollide_init', () => {
	team.add('ssb_nocollide')
	team.modify('ssb_nocollide', 'collisionRule', 'never')
	team.modify('ssb_nocollide', 'seeFriendlyInvisibles', false)
}, { runOnLoad: true })

export const timer = Objective.create('ssb_time', 'dummy')
export const timerScore = timer('$time')

MCFunction('sections/rythm/active/forceload', () => {
	execute.in(DIM).run(() => {
		const [fxMin, fzMin] = arena.forceloadMin
		const [fxMax, fzMax] = arena.forceloadMax
		forceload.add(abs(fxMin, fzMin), abs(fxMax, fzMax))
	})
}, { runOnLoad: true })

export const setActive = MCFunction('sections/rythm/active/init', () => {
	gameState.set(GameState.ACTIVE)

	execute.in(DIM).run(() => {
		const [x, y, z] = arena.playerSpawn
		tp(allPlayers, abs(x, y, z), [`${arena.playerYaw}`, '0'])
	})

	gamemode('adventure', allPlayers)
	team.join('ssb_nocollide', allPlayers)

	execute.as(allPlayers).run(() => {
		attribute('@s', 'minecraft:movement_speed').baseSet(0.13)
		wallLives('@s').set(livesDefault)
		effect.give('@s', 'minecraft:instant_health', 1, 126, true)
		effect.give('@s', 'minecraft:invisibility', 99999, 0, true)
		effect.give('@s', 'minecraft:saturation', 99999, 0, true)
		points('@s').set(0)
		combo('@s').set(0)
		finalScore('@s').set(0)
	})

	gamerule('natural_health_regeneration', false)

	if (songCount === 1) {
		timerScore.set(songDurations[0] * 20)
	} else {
		let chain = _.if(songScore.equalTo(0), () => { timerScore.set(songDurations[0] * 20) })
		for (let i = 1; i < songCount; i++) {
			const idx = i
			chain = chain.elseIf(songScore.equalTo(idx), () => { timerScore.set(songDurations[idx] * 20) })
		}
	}

	playSong()
	scheduleWalls()

	execute.as(allPlayers).at('@s').run.playsound('minecraft:entity.player.levelup', 'master', '@s')
}, { lazy: true })
