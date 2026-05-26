import { MCFunction, title } from 'sandstone'
import { songScore } from './game/state'
import { songNames } from './config/songs'

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
import './game/buttons'
import './game/debug'

MCFunction('sections/rhythm/init_player', () => {
	songScore.set(0)
	title('@s').actionbar({ text: songNames[0] ?? 'No songs loaded', color: 'aqua' })
})

MCFunction('sections/rhythm/clean_player', () => {
})
