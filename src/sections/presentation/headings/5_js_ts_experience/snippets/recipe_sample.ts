import { Recipe } from 'sandstone'

// == snippet start ==
export const my_recipe = Recipe('sample/my_recipe', {
    type: 'crafting_shaped',
    pattern: [
        'F-F',
        'F-F',
        '-D-'
    ],
    key: {
        'F': 'feather',
        '-': 'air',
        'D': 'diamond'
    },
    result: 'wind_charge',
    show_notification: true
})
// == snippet end ==

const placeholder = 'placeholder'
export default placeholder