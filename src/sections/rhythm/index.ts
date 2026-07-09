import { _, execute, MCFunction, Selector, kill } from 'sandstone'
import { killSkybox, placeMap, spawnSkybox } from './game/arena-map'
import { endGame, resetPlayer } from './game/end'
import { spawnSettingsPanel } from './game/settings'
import { cancelStart } from './game/start'
import { GameStatus, Tags, status } from './game/state'

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
import { spawnLaneBorder } from './game/lane-effects'

export const setup = MCFunction(
	'sections/rhythm/setup',
	() => {
		spawnSkybox()
		placeMap()
		spawnLaneBorder()
		spawnSettingsPanel()
	},
)

// Clean up when swapping out rhythm game
export const cleanup = MCFunction(
	'sections/rhythm/cleanup',
	() => {
		killSkybox()
		kill(Selector('@e', { tag: Tags.LANE_BORDER }))
		kill(Selector('@e', { tag: Tags.UI_SETTINGS }))
	}
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
