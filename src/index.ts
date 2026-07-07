import { MCFunction, Selector } from 'sandstone'
import { SelectorProperties } from 'sandstone/variables'

import { ticking } from './shared'
import './sections/main'
import './version'
// TODO: Disabled while developing presentation
import './sections/rhythm/index'
//import './sections/magic/index'
import './sections/presentation/index'

MCFunction('main', () => {
    const all_players = (args: SelectorProperties<false, false, 'minecraft:player'>) => Selector(
        '@a',
        { x: 69, y: 69, z: 69, dx: 69, dy: 69, dz: 69, ...args }
    )
}, {
    tags: [ticking]
})

MCFunction('init_player', () => {
    const player = Selector('@s')
})

MCFunction('clean_player', () => {
    const player = Selector('@s')
})