import { Label, MCFunction, particle, rel, abs, Variable, damage, execute, Selector, tp, raw, Objective, _ } from 'sandstone'
import { castSpell, spellMeta } from '../Common'
import { Charged, Stunned } from '../../StatusEffects'
import { checkHit } from '../../utils/hitDetection'
import { fireRaycast } from '../../utils/raycast'

const meta = spellMeta('lightning', 'thunderbolt')
const rollScore = Objective.create(`spell.lightning.thunderbolt_roll`, 'dummy')

const chainStrike = MCFunction(`sections/magic/${meta.spellPath}/chain_strike`, () => {
    particle('end_rod', rel(0, 0, 0), abs(0.1, 1, 0.1), 0, 5, 'force')
    particle('electric_spark', rel(0, 1, 0), abs(0.3, 0.5, 0.3), 0.2, 20, 'force')
    
    damage('@s', 4, 'lightning_bolt')
    Stunned.apply(Variable(2))
    Charged.apply(Variable(2))
})

const strikeAtPosition = MCFunction(`sections/magic/${meta.spellPath}/strike_at_position`, () => {
    checkHit({
        width: 3,
        height: 3,
        onHit: () => {
            chainStrike()
        }
    })
}, { lazy: true })

const boltRaycast = fireRaycast(meta.spellPath, {
    maxSteps: 60,
    stepSize: 0.5,
    onStep: () => {
        // Thin electric trail
        particle('electric_spark', rel(0, 0, 0), abs(0.02, 0.02, 0.02), 0.01, 1, 'force')
    },
    onHit: () => strikeAtPosition(),
    onComplete: () => strikeAtPosition(),
    onStart: () => {
        tp('@s', rel(0, 1.62, 0))
    },
})

MCFunction(`sections/magic/${meta.spellPath}/cast`, () => {
    castSpell('thunderbolt', 'lightning', () => {
        boltRaycast()
    })
});