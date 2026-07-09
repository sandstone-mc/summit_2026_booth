import { MCFunction, Selector } from 'sandstone'

import './showcase'

MCFunction('sections/main/init_player', () => {
    const player = Selector('@s')
})

MCFunction('sections/main/clean_player', () => {
    const player = Selector('@s')
})