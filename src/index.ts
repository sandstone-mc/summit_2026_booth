import { functionCmd, MCFunction } from 'sandstone'

import { NAMESPACE, ticking } from './shared'
import './version'
import './sections/rhythm/index'

MCFunction('main', () => {
}, {
	tags: [ticking],
})

MCFunction('init_player', () => {
	functionCmd(`${NAMESPACE}:sections/rhythm/init_player`)
})

MCFunction('clean_player', () => {
	functionCmd(`${NAMESPACE}:sections/rhythm/clean_player`)
})
