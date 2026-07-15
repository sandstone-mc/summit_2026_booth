import { fireRaycast } from '../../utils/raycast'
import { particle, MCFunction, rel, tp, abs, Selector } from 'sandstone'
import { spellMeta, castSpell, ParticleViewerSelector } from '../Common'

const meta = spellMeta('arcane', 'blink')

const blink = fireRaycast(meta.spellPath, {
    maxSteps: 15,
    onStart: () => {
        tp('@s', rel(0, 1.62, 0))
    },
    onStep: () => {},
    onHit: () => {
        particle('portal', rel(0, 0, 0), abs(0.3, 0.8, 0.3), 0.1, 30, 'force', ParticleViewerSelector)
    },
    onFinish: () => {
        particle('portal', rel(0, 0, 0), abs(0.3, 0.8, 0.3), 0.1, 30, 'force', ParticleViewerSelector)
        tp('@s', rel(0, 0, 0))
        particle('portal', rel(0, 0, 0), abs(0.3, 0.8, 0.3), 0.1, 30, 'force', ParticleViewerSelector)
    }
})

MCFunction(`sections/magic/${meta.spellPath}/cast`, () => {
    castSpell('blink', 'arcane', () => {
        blink()
    })
})