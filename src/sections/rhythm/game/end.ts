import { _, abs, attribute, effect, execute, MCFunction, Selector, stopsound, tag, tp } from 'sandstone'
import { GameStatus, Tags, WallEntityType, gamePlayer, boothListeners, status, songSelect } from './state'
import { clearWalls } from './walls/spawning'
import { stopAllSongs, stopAllWalls, stopSong, stopWalls } from './songs'
import { computeScores } from './scoring'
import { parkourCleanup } from './parkour'
import { clearLaneHighlight } from './lane-effects'
import { updateSettingsPanel } from './settings'
import { boothReturn } from '@rhythm/config/internal/derived'
import { endShowcaseSession, PlayersInShowcase } from 'src/sections/main/showcase'
import { timer, grantSticker } from './active'

function gamePlayerInShowcase() {
	return Selector('@a', {
		tag: Tags.PLAYER,
		...PlayersInShowcase.arguments,
	})
}

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
		clearLaneHighlight()

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

		grantSticker.schedule.clear()

		stopSong()
		stopWalls()
		computeScores()

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
		clearLaneHighlight()
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
			// a vanished player (disconnect without the clean hook) or one who wandered out of
			// the showcase area (glitch, teleport, etc.) must not strand the match
			execute.unless.entity(gamePlayerInShowcase()).run(() => {
				endGame()
			})
			timer.remove(1)
			// once the song is over, wait for the last walls to leave the lane
			_.if(_.and(timer.lessThanOrEqualTo(0), _.not(_.entity(Selector('@e', { tag: Tags.WALL, type: WallEntityType })))), () => {
				endGame()
			})
		})
	},
	{ lazy: true },
)
