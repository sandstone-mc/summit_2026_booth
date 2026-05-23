import { functionCmd, MCFunction, Selector } from 'sandstone'

import { ticking } from './shared'
import './sections/rythm/index'

MCFunction('main', () => {
}, {
	tags: [ticking],
})

MCFunction('init_player', () => {
	functionCmd('sandstone_summit_booth:sections/rythm/init_player')
})

MCFunction('clean_player', () => {
	functionCmd('sandstone_summit_booth:sections/rythm/clean_player')
})
