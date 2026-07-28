import { abs, MCFunction, summon } from 'sandstone'
import { BOOTH_ENTITY_TAG } from '@shared'

MCFunction('sections/main/interactive_blocks', () => {
    summon('marker', abs(-59.5, 85.5, 48.5))
    summon('marker', abs(-59.5, 75.5, 47.5))
    summon('marker', abs(-53.5, 65.5, 50.5), { Tags: [BOOTH_ENTITY_TAG] })
}, {
    runOnLoad: true,
    addToSandstoneCore: Bun.env.DEV_HELPERS === 'true',
})