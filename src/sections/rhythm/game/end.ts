import { _, abs, attribute, clear, effect, execute, gamemode, gamerule, kill, MCFunction, raw, schedule, Selector, stopsound, tag, team, title, tp } from 'sandstone'
import { GameStatus, Tags, allPlayers, alivePlayers, status } from './state'
import { clearWalls } from './walls/spawning'
import { stopSong, stopWalls } from './songs'
import { computeScores } from './scoring'
import { parkourCleanup } from './parkour'
import { clearLaneShulkers } from './lane-effects'
import { Positions, DIM, NAMESPACE } from '../../../shared'
import { timer } from './active'

MCFunction('sections/rhythm/timer/tick', () => {
	_.if(status.equalTo(GameStatus.ACTIVE), () => {
		timer.remove(1)
		_.if(timer.lessOrEqualThan(0), () => {
			endGame()
		})
	})
}, { runEveryTick: true })

export const endGame = MCFunction('sections/rhythm/end/run', () => {
	status.set(GameStatus.ENDING)

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
	clearLaneShulkers()

	execute.as(allPlayers).run(() => {
		effect.clear('@s')
		attribute('@s', 'minecraft:movement_speed').baseSet(0.1)
		clear('@s')
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

	status.set(GameStatus.WAITING)
}, { lazy: true })
