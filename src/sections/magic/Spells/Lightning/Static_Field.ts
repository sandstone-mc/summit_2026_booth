// spells/lightning/static_field.ts
import { Label, MCFunction, Objective, Selector, _, abs, damage, execute, particle, rel, Variable, tellraw, sleep } from 'sandstone'
import { castSpell, spellMeta } from '../Common'
import { checkHit } from '../../utils/hitDetection'
import { Stunned } from '../../StatusEffects'

const meta = spellMeta('lightning', 'static_field')
const StaticField = Label('status.static_field')
const fieldDuration = Objective.create('status.static_field_timer', 'dummy')

MCFunction(`sections/magic/${meta.spellPath}/update`, () => {
    execute.as(Selector('@a', { tag: StaticField })).at('@s').run(() => {
        // Aura particles
        particle('electric_spark', rel(0, 1, 0), abs(0.5, 0.8, 0.5), 0.05, 2, 'force')
        particle('end_rod', rel(0, 1.6, 0), abs(0.2, 0.5, 0.2), 0.1, 20, 'force')

        fieldDuration('@s').remove(10)
        _.if(fieldDuration('@s').lessThanOrEqualTo(0), () => {
            StaticField('@s').remove()
            tellraw('@s', { text: 'Static Field faded.', color: 'gray' })
        })

        checkHit({
            width: 2,
            height: 3,
            onHit: () => {
                particle('electric_spark', rel(0, 1, 0), abs(0.2, 0.5, 0.2), 0.1, 10, 'force')
                damage('@s', 1, 'lightning_bolt')
                Stunned.apply(Variable(1))
            }
        })
    })
}, { runEvery: 10 })

const doCast = MCFunction(`sections/magic/${meta.spellPath}/do_cast`, () => {
    StaticField('@s').add()
    fieldDuration('@s').set(200)
    tellraw('@s', { text: 'Static Field activated!', color: 'yellow' })
    particle('electric_spark', rel(0, 1, 0), abs(0.5, 1, 0.5), 0.1, 40, 'force')
    sleep('10s')
    _.if(StaticField('@s'), () => {
        StaticField('@s').remove()
        tellraw('@s', { text: 'Static Field faded.', color: 'gray' })
    })
}, { asyncContext: true, lazy: true })

MCFunction(`sections/magic/${meta.spellPath}/cast`, () => {
    castSpell('static_field', 'lightning', () => {
        _.if(_.not(StaticField('@s')), () => {
            doCast()
        }).else(() => {
            tellraw('@s', { color: 'red', text: 'Static Field already active!' })
        })
    })
});