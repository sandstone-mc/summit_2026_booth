import { _, abs, damage, data, Data, effect, execute, kill, Label, MCFunction, particle, rel, Selector, Variable } from 'sandstone'
import { Freezing } from '../../StatusEffects'
import { castSpell, Caster, Lifetime } from '../Common'

const spellPath = 'spells/ice/blizzard'
const Storm = Label('spell.ice.blizzard.storm')

const spawnStorm = MCFunction(`${spellPath}/spawn_bolt`, () => {
    execute.positioned('~ ~-1 ~').run(() => {
        Caster('@s').add()

        execute.summon('minecraft:marker').run(() => {
            Storm('@s').add()
            Lifetime('@s').set(200)
            data.modify(Data('entity', '@s').select('data.owner')).set.from(Data('entity', Selector('@n', {
                tag: Caster
            })).select('UUID'))
        })

        Caster('@s').remove()
    })
})

MCFunction(`${spellPath}/update_storms`, () => {
    const StormSelector = Selector('@e', {
        type: 'minecraft:marker',
        tag: Storm
    })

    execute.as(StormSelector).at('@s').run(() => {
        particle('snowflake', rel(0, 3, 0), abs(3, 3, 3), 0.0, 80, 'force')
        Lifetime('@s').remove(5)

        _.if(Lifetime('@s').lessOrEqualThan(0), () => {
            kill('@s')
        })

        execute.as(Selector('@e', { distance: [0, 6], type: '#arcane_arts:targetable' })).run(() => {
            damage('@s', 0.1, 'freeze')
            Freezing.apply(Variable(2))
            effect.give('@s', 'minecraft:blindness', 2, 1, true)
        })
    })
}, { runEvery: 5 })

MCFunction(`${spellPath}/cast`, () => {
    castSpell('blizzard', 'ice', () => spawnStorm())
})
