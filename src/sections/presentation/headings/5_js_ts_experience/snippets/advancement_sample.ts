import { Advancement } from 'sandstone'

// == snippet start ==
import { my_func } from './mcfunction_sample'
import { my_recipe } from './recipe_sample'

export const my_advancement = Advancement('sample/my_advancement', {
    criteria: {
        jump: {
            trigger: 'tick',
            conditions: {
                player: {
                    "type_specific/player": {
                        input: {
                            jump: true
                        }
                    }
                }
            }
        }
    },
    display: {
        icon: 'wind_charge',
        title: 'Jump for Joy!',
        description: 'You jumped! Good Job.',
        hidden: true
    },
    rewards: {
        function: my_func,
        recipes: [my_recipe],
    }
})
// == snippet end ==

const placeholder = 'placeholder'
export default placeholder