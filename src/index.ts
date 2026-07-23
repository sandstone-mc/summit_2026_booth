import './check-tools'
import { advancement, MCFunction, sandstonePack, Selector } from 'sandstone'

// import './version'

import './sections/presentation'

if (!(Bun.env.DISABLE_SHOWCASE === undefined ? false : Bun.env.DISABLE_SHOWCASE === 'true')) {
    await import('./sections/elevator')
    await import('./sections/main')
    await import('./sections/npcs')
    await import('./sections/rhythm/index')
    await import('./sections/magic/index')
}

import './ticked_functions'

MCFunction('init_player', () => {
    const player = Selector('@s', { type: 'minecraft:player' })

    // grant the visit sticker advancement
    advancement.grant(player).only('summit.sticker_book:sandstone_summit_booth/enter_booth')
})