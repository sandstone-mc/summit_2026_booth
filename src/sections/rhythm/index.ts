import { _, execute, MCFunction, Selector } from 'sandstone'
import { spawnSkybox } from './game/arena-map'
import { endGame, resetPlayer } from './game/end'
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

MCFunction(
	'sections/rhythm/setup',
	() => {
		spawnSkybox()
	},
	{ runOnLoad: true },
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
