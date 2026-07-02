import { abs, damage, execute, kill, loc, MCFunction, particle, Selector, summon, Variable } from 'sandstone'
import { castSpell, spellMeta } from '../Common'
import { Freezing } from '../../StatusEffects'

const meta = spellMeta('ice', 'frost_nova')
const NovaMarker = meta.label('arc_center')

MCFunction(`sections/magic/${meta.spellPath}/cast`, () => {
    castSpell('frost_nova', 'ice', () => {
        execute.anchored('eyes').rotated.as('@s').run(() => {
            summon('marker', loc(0, 0, 3), { Tags: [`sandstone_summit_booth.${NovaMarker.name}`] })
        })

        execute.as(Selector('@e', {
            type: '#sandstone_summit_booth:targetable',
            distance: [0, 5.5],
        })).at('@s').run(() => {
            execute.if.entity(Selector('@e', {
                tag: NovaMarker,
                distance: [0, 2.5],
            })).run(() => {
                damage('@s', 3, 'freeze')
                Freezing.apply(Variable(3))
            })
        })

        execute.anchored('eyes').rotated.as('@s').run(() => {
            particle('snowflake', loc(0, 0, 2), abs(1, 1, 1.5), 0.02, 60, 'force')
            // particle('powder_snow', loc(0, 0, 2), abs(1.2, 0.8, 2), 0.01, 40, 'force')
            particle('item_snowball', loc(0, 0, 1.5), abs(0.8, 0.8, 1), 0.05, 25, 'force')
        })

        kill(Selector('@e', { tag: NovaMarker }))
    })
})
