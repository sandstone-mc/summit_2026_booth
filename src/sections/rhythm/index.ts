import { MCFunction, title } from 'sandstone'
import { songSelect } from './game/state'
import { songNames } from './config/songs'
import { spawnSkybox } from './game/arena-map'

import './game/state'
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

MCFunction('sections/rhythm/setup', () => {
	spawnSkybox()
}, { runOnLoad: true })

MCFunction('sections/rhythm/init_player', () => {
	songSelect.set(0)
	title('@s').actionbar({ text: songNames[0] ?? 'No songs loaded', color: 'aqua' })
})

MCFunction('sections/rhythm/clean_player', () => {
})
