import { functionCmd, MCFunction, Selector } from 'sandstone'

import { ticking } from './shared'
import './sections/rhythm/index'

MCFunction('main', () => {
}, {
	tags: [ticking],
})

MCFunction('init_player', () => {
	functionCmd('sandstone_summit_booth:sections/rhythm/init_player')
})

MCFunction('clean_player', () => {
	functionCmd('sandstone_summit_booth:sections/rhythm/clean_player')
})
