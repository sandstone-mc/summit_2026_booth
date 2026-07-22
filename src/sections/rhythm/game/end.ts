import { _, abs, advancement, attribute, effect, execute, MCFunction, Selector, stopsound, tag, tp } from 'sandstone'
import { GameStatus, Tags, gamePlayer, boothListeners, status, songSelect } from './state'
import { clearWalls } from './walls/spawning'
import { stopAllSongs, stopAllWalls, stopSong, stopWalls } from './songs'
import { computeScores } from './scoring'
import { wallLives } from './walls/collision'
import { parkourCleanup } from './parkour'
import { clearLaneShulkers } from './lane-effects'
import { saveLeaderboard } from './leaderboard'
import { updateSettingsPanel } from './settings'
import { ticking } from '@shared'
import { boothReturn } from '@rhythm/config/internal/derived'
import { endShowcaseSession } from 'src/sections/main/showcase'
import { timer } from './active'

export const resetPlayer = MCFunction('sections/rhythm/reset_player', () => {
	effect.clear('@s')
	tag('@s').remove(Tags.PLAYER)
	tag('@s').remove(Tags.WALL_HIT_COOLDOWN)
})

const cleanup = MCFunction(
	'sections/rhythm/end/cleanup',
	() => {
		clearWalls()
		parkourCleanup()
		clearLaneShulkers()

		const [x, y, z] = boothReturn
		tp(gamePlayer, abs(x, y, z))

		execute.as(gamePlayer).run(() => {
			resetPlayer()
		})

		status.set(GameStatus.WAITING)
		updateSettingsPanel()

		endShowcaseSession()
	},
	{ lazy: true },
)

export const endGame = MCFunction(
	'sections/rhythm/end/run',
	() => {
		status.set(GameStatus.ENDING)

		_.if(timer.lessThanOrEqualTo(0), () => {
			advancement
				.grant(Selector('@a', { tag: Tags.PLAYER, scores: { [wallLives.name]: [1, Infinity] } }))
				.only('summit.sticker_book:sandstone_summit_booth/rhythm')
		})

		stopSong()
		stopWalls()
		computeScores()
		saveLeaderboard()

		cleanup.schedule.function('3s', 'replace')
	},
	{ lazy: true },
)

export const resetGame = MCFunction(
	'sections/rhythm/reset',
	() => {
		stopAllSongs()
		stopAllWalls()
		clearWalls()
		parkourCleanup()
		clearLaneShulkers()
		stopsound(boothListeners, 'master')

		const [x, y, z] = boothReturn
		tp(gamePlayer, abs(x, y, z))

		execute.as(gamePlayer).run(() => {
			resetPlayer()
		})

		status.set(GameStatus.WAITING)
		songSelect.set(0)
	},
	{ runOnLoad: true },
)

export const timerTick = MCFunction(
	'sections/rhythm/timer/tick',
	() => {
		_.if(status.equalTo(GameStatus.ACTIVE), () => {
			// a vanished player (disconnect without the clean hook) must not strand the match
			execute.unless.entity(gamePlayer).run(() => {
				endGame()
			})
			timer.remove(1)
			// once the song is over, wait for the last walls to leave the lane
			_.if(_.and(timer.lessThanOrEqualTo(0), _.not(_.entity(Selector('@e', { tag: Tags.WALL })))), () => {
				endGame()
			})
		})
	},
	{ lazy: true },
)
