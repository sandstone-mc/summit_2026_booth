import { give, MCFunction, tellraw } from 'sandstone'

// == snippet start ==
export const my_func = MCFunction('sample/my_func', () => {
    tellraw('@s', {
        text: `You did it! Here's some boosts to get you started :)`
    })

    give('@s', 'wind_charge', 5)
})
// == snippet end ==

const placeholder = 'placeholder'
export default placeholder