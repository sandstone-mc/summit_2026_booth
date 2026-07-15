import { MCFunction, _, execute, particle, rel, abs, fill, summon } from 'sandstone'
import { createStatusEffect, ParticleViewerSelector } from './Common'

const status = createStatusEffect({
    name: 'freezing',
    damageType: 'freeze',
    damageAmount: 1,
    damageInterval: 20,
    particles: () => {
        particle('snowflake', rel(0, 1, 0), abs(0.1, 0.25, 0.1), 0.01, 5, 'force', ParticleViewerSelector)
    },
    onApply: () => {},
    onEnd: () => {},
    onTick: () => {},
})

export default status;