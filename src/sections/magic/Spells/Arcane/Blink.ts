import { fireRaycast } from '../../utils/raycast'
import { particle, MCFunction, rel, tp, abs } from 'sandstone'
import { spellMeta, castSpell } from '../Common'

const meta = spellMeta('arcane', 'blink')

const blink = fireRaycast(meta.spellPath, {
    maxSteps: 15,
    onStart: () => {
        tp('@s', rel(0, 1.62, 0))
    },
    onStep: () => {},
    onHit: () => {
        particle('portal', rel(0, 0, 0), abs(0.3, 0.8, 0.3), 0.1, 30, 'force')
    },
    onFinish: () => {
        particle('portal', rel(0, 0, 0), abs(0.3, 0.8, 0.3), 0.1, 30, 'force')
        tp('@s', rel(0, 0, 0))
        particle('portal', rel(0, 0, 0), abs(0.3, 0.8, 0.3), 0.1, 30, 'force')
    }
})

MCFunction(`sections/magic/${meta.spellPath}/cast`, () => {
    castSpell('blink', 'arcane', () => {
        blink()
    })
})