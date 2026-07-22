import { _, abs, execute, fill, kill, MCFunction, Objective, Selector, Variable } from 'sandstone'
import { arena } from './config/internal/arena'
import { killSkybox, placeMap } from './game/arena-map'
import { endGame, resetGame, resetPlayer } from './game/end'
import { laneTeamsInit, spawnLaneBorder } from './game/lane-effects'
import { spawnLeaderboardPanel } from './game/leaderboard'
import { spawnSettingsPanel } from './game/settings'
import { cancelStart } from './game/start'
import { GameStatus, Tags, status } from './game/state'

export const calibrationDepth = Variable(0)
export const calOffsetMs = Objective.create('rhythm.cal', 'dummy')

import './game/state'
import './game/tick'
import './game/walls/spawning'
import './game/walls/ticking'
import './game/walls/collision'
import './game/scoring'
import './game/parkour'
import './game/songs'
import './game/start'
import './game/active'
import './game/end'
import './game/settings'
import './game/leaderboard'
import './game/lane-effects'
import './game/arena-map'
import './game/debug'
import './dev'

export const setup = MCFunction(
	'sections/rhythm/setup',
	() => {
		laneTeamsInit()
		placeMap()
		spawnLaneBorder()
		spawnSettingsPanel()
		spawnLeaderboardPanel()
		resetGame()
	},
	{ lazy: true },
)

export const cleanup = MCFunction(
	'sections/rhythm/clear',
	() => {
		resetGame()
		kill(Selector('@e', { tag: Tags.LANE_BORDER }))
		kill(Selector('@e', { tag: Tags.UI_SETTINGS }))
		killSkybox()
		// fill(abs(...arena.mapOrigin), abs(...arena.mapEnd), 'minecraft:air').strict()
	},
	{ lazy: true },
)

MCFunction('sections/rhythm/init_player', () => {
	_.if(status.equalTo(GameStatus.WAITING), () => {
		resetPlayer()
	})
})

MCFunction('sections/rhythm/clean_player', () => {
	execute.if.entity(Selector('@s', { tag: Tags.PLAYER })).run(() => {
		_.if(status.equalTo(GameStatus.ACTIVE), () => {
			endGame()
		}).elseIf(status.equalTo(GameStatus.STARTING), () => {
			cancelStart()
		})
	})
	resetPlayer()
})
