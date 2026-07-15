import { MCFunction, Objective, Selector, _, damage, execute, particle, rel, abs, raw, Variable, tp } from 'sandstone'
import { createStatusEffect, ParticleViewerSelector } from './Common'
import { fireRaycast } from '../utils/raycast'

const EffectName = 'charged'
const rollScore = Objective.create(`status.${EffectName}_roll`, 'dummy')

const nearbyUncharged = Selector('@e', {
    type: '#sandstone_summit_booth:targetable',
    tag: [`!sandstone_summit_booth.status.${EffectName}`],
    distance: [0, 8],
    limit: 1,
    sort: 'nearest'
})

const arcRaycast = fireRaycast(`status/${EffectName}/arc`, {
    maxSteps: 20,
    stepSize: 0.4,
    onStart: () => {
        // Lift to chest height and face target
        tp('@s', rel(0, 1.62, 0))
        raw(`rotate @s facing entity ${nearbyUncharged} feet`)
    },
    onStep: () => {
        particle('electric_spark', rel(0, 0, 0), abs(0.05, 0.05, 0.05), 0.1, 2, 'force', ParticleViewerSelector)

        // Stop when we reach the target
        execute.if.entity(Selector('@e', {
            type: '#sandstone_summit_booth:targetable',
            tag: [`!sandstone_summit_booth.status.${EffectName}`],
            distance: [0, 0.6]
        })).run(() => {
            // Burst particles at contact point
            particle('electric_spark', rel(0, 0, 0), abs(0.3, 0.8, 0.3), 0.1, 20, 'force', ParticleViewerSelector)
            raw(`tag @e[tag=status.${EffectName}.arc.ray_active,limit=1] remove status.${EffectName}.arc.ray_active`)
        })
    },
    onHit: () => {
        // Hit a block before reaching target
        particle('electric_spark', rel(0, 0, 0), abs(0.1, 0.3, 0.1), 0.05, 5, 'force', ParticleViewerSelector)
    }
})

const arcToTarget = MCFunction(`sections/magic/status/${EffectName}/arc_to_target`, () => {
    arcRaycast()
}, { lazy: true })

const status = createStatusEffect({
    name: EffectName,
    damageType: 'lightning_bolt',
    damageAmount: 1,
    damageInterval: 30,
    particles: () => {
        particle('electric_spark', rel(0, 1, 0), abs(0.3, 0.5, 0.3), 0.05, 3, 'force', ParticleViewerSelector)
    },
    onApply: () => {},
    onEnd: () => {},
    onTick: () => {
        raw(`execute store result score @s ${rollScore.name} run random value 1..50`)

        _.if(rollScore('@s').equalTo(1), () => {
            execute.if.entity(nearbyUncharged).run(() => {
                arcToTarget()

                execute.as(nearbyUncharged).run(() => {
                    particle('electric_spark', rel(0, 1, 0), abs(0.3, 0.5, 0.3), 0.1, 15, 'force', ParticleViewerSelector)
                    damage('@s', 1, 'lightning_bolt')
                    status.apply(Variable(1))
                })

                damage('@s', 1, 'lightning_bolt')
            })
        })
    }
})

MCFunction('sections/magic/test/charged', () => {
    status.apply(Variable(5))
})

export default status;