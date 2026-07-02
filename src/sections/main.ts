import { MCFunction, Selector } from 'sandstone'

MCFunction('sections/main/init_player', () => {
    const player = Selector('@s')

    // TODO: uncomment when stickers work
    // grant the visit sticker advancement
    // advancement.grant(player).only('summit.sticker_book:sandstone_summit_booth/enter_booth')
})

MCFunction('sections/main/clean_player', () => {
    const player = Selector('@s')
})