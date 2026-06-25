import { _, abs, attribute, clear, effect, execute, gamemode, gamerule, kill, MCFunction, schedule, Selector, stopsound, tag, team, title, tp } from 'sandstone'
import { GameStatus, Tags, allPlayers, alivePlayers, status } from './state'
import { clearWalls } from './walls/spawning'
import { stopSong, stopWalls } from './songs'
import { computeScores } from './scoring'
import { parkourCleanup } from './parkour'
import { clearLaneShulkers } from './lane-effects'
import { saveLeaderboard } from './leaderboard'
import { updateSettingsPanel } from './settings'
import { Positions, DIMENSION, NAMESPACE } from '@shared'
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
	saveLeaderboard()

	schedule.function(`${NAMESPACE}:sections/rhythm/end/cleanup`, '3s')
}, { lazy: true })

const cleanup = MCFunction('sections/rhythm/end/cleanup', () => {
	execute.in(DIMENSION).run(() => {
		clearWalls()
		parkourCleanup()
	})
	clearLaneShulkers()

	execute.in(DIMENSION).run(() => {
		const [x, y, z] = Positions.BOOTH_RETURN
		tp(allPlayers, abs(x, y, z))
	})

	execute.as(allPlayers).run(() => {
		effect.clear('@s')
		attribute('@s', 'minecraft:movement_speed').baseSet(0.1)
		clear('@s', '*')
		tag('@s').remove(Tags.ALIVE)
		tag('@s').remove(Tags.PLAYER)
		tag('@s').remove(Tags.WALL_HIT_COOLDOWN)
		tag('@s').remove(Tags.HIT_TICK)
	})

	team.leave(Selector('@a'))
	gamerule('natural_health_regeneration', true)
	gamemode('adventure', Selector('@a'))

	status.set(GameStatus.WAITING)
	updateSettingsPanel()
}, { lazy: true })
