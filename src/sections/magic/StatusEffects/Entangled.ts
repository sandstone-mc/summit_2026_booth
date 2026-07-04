import { createStatusEffect } from './Common'
import { particle, rel, abs, attribute } from 'sandstone'

const status = createStatusEffect({
    name: 'entangled',
    damageType: 'cactus',
    damageAmount: 1,
    damageInterval: 15,
    particles: () => {
        particle('minecraft:tinted_leaves{color:[0,1,0,1]}', rel(0, 1, 0), abs(0.1, 0.25, 0.1), 0.01, 1, 'force')
    },
    onApply: () => {
        attribute('@s', 'minecraft:movement_speed').add(`arcane_arts:entangled`, -0.5, 'add_multiplied_total')
    },
    onEnd: () => {
        attribute('@s', 'minecraft:movement_speed').remove(`arcane_arts:entangled`)
    },
    onTick: () => {},
})

export default status;