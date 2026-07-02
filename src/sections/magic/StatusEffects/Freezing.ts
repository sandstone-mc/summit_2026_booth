import { Label, MCFunction, Objective, Selector, _, damage, execute, particle, rel, abs, Advancement, fill, summon, kill, Score, Macro, raw, Variable } from 'sandstone'
import { createStatusEffect } from './Common'

const freezeAdvancement = Advancement(`status/freezing`, {
    'criteria': {
        'tick':{
            'trigger': 'minecraft:tick'
        }
    },
    'rewards': {
        'function': `sandstone_summit_booth:sections/magic/status/freezing/tryfreeze`
    }
})

const status = createStatusEffect({
    name: 'freezing',
    damageType: 'freeze',
    damageAmount: 1,
    damageInterval: 20,
    particles: () => {
        particle('snowflake', rel(0, 1, 0), abs(0.1, 0.25, 0.1), 0.01, 5, 'force')
    },
    onApply: () => {},
    onEnd: () => {},
    onTick: () => {},
})



MCFunction(`sections/magic/status/freezing/tryfreeze`, () => {
    freezeAdvancement.revoke('@s')

    _.if(status.statusTag('@s'), () => {
        execute.store.success(status.statusTime('#snow')).run(() => {
            fill(rel(0, 1, 0), rel(0, 1, 0), 'powder_snow').replace('air')
        })

        _.if(status.statusTime('#snow').equalTo(1), () => {
            summon('marker', rel(0, 1, 0), {
                Tags: [ `sandstone_summit_booth.status.freezing.snow` ]
            })
        })
    })
})

export default status;