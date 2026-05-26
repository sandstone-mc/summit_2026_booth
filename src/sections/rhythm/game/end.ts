import { _, abs, attribute, effect, execute, gamemode, gamerule, kill, MCFunction, raw, schedule, Selector, stopsound, tag, team, title, tp } from 'sandstone'
import { GameState, Tags, allPlayers, alivePlayers, gameState } from './state'
import { clearWalls } from './walls/spawning'
import { stopSong, stopWalls } from './songs'
import { computeScores } from './scoring'
import { parkourCleanup } from './parkour'
import { Positions, DIM, NAMESPACE } from '../../../shared'
import { timerScore } from './active'

MCFunction('sections/rhythm/timer/tick', () => {
	_.if(gameState.equalTo(GameState.ACTIVE), () => {
		timerScore.remove(1)
		_.if(timerScore.lessOrEqualThan(0), () => {
			endGame()
		})
	})
}, { runEveryTick: true })

export const endGame = MCFunction('sections/rhythm/end/run', () => {
	gameState.set(GameState.ENDING)

	stopSong()
	stopWalls()
	computeScores()

	schedule.function(`${NAMESPACE}:sections/rhythm/end/cleanup`, '3s')
}, { lazy: true })

const cleanup = MCFunction('sections/rhythm/end/cleanup', () => {
	execute.in(DIM).run(() => {
		clearWalls()
		parkourCleanup()
	})

	execute.as(allPlayers).run(() => {
		effect.clear('@s')
		attribute('@s', 'minecraft:movement_speed').baseSet(0.1)
		raw('clear @s')
		tag('@s').remove(Tags.ALIVE)
		tag('@s').remove(Tags.PLAYER)
	})

	team.leave(allPlayers)
	gamerule('natural_health_regeneration', true)

	execute.in('minecraft:overworld').run(() => {
		const [x, y, z] = Positions.BOOTH_RETURN
		tp(allPlayers, abs(x, y, z))
	})
	gamemode('adventure', allPlayers)

	gameState.set(GameState.WAITING)
}, { lazy: true })
