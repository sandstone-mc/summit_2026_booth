import './check-tools'
import { advancement, MCFunction, Selector } from 'sandstone'
import { SelectorProperties } from 'sandstone/variables'

import { ticking } from './shared'
import './version'

import './sections/presentation/index'

if (!Boolean(Bun.env.DISABLE_SHOWCASE ?? false)) {
    await import('./sections/main')
    await import('./sections/rhythm/index')
    await import('./sections/magic/index')
}

import './ticked_functions'

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

     // TODO: uncomment when stickers work
    // grant the visit sticker advancement
    advancement.grant(player).only('summit.sticker_book:sandstone_summit_booth/enter_booth')
})

MCFunction('clean_player', () => {
    const player = Selector('@s')
})