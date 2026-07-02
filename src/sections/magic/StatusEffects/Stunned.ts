import { createStatusEffect } from './Common'

import { Label, MCFunction, Objective, Selector, _, Macro, damage, execute, particle, rel, abs, Score, Variable, attribute } from 'sandstone'

const status = createStatusEffect({
    name: 'stunned',
    damageType: 'generic',
    damageAmount: 0,
    damageInterval: 1000,
    particles: () => {
        particle('crit', rel(0, 1, 0), abs(0.1, 0.25, 0.1), 0.01, 1, 'force')
        particle('electric_spark', rel(0, 1, 0), abs(0.3, 0.5, 0.3), 0.05, 3, 'force')
    },
    onApply: () => {
        attribute('@s', 'minecraft:movement_speed').add(`sandstone_summit_booth:stunned`, -0.3, 'add_multiplied_total')
    },
    onEnd: () => {
        attribute('@s', 'minecraft:movement_speed').remove(`sandstone_summit_booth:stunned`)
    },
    onTick: () => {},
})

export default status;