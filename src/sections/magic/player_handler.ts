import { _, execute, MCFunction, Objective, title, Variable } from 'sandstone'
import { getSelf, saveSelf, io } from './PlayerDB'
import { SessionPlayer } from './SummitShowcase/ShowcaseState'

export const mana = Objective.create('mana')
export const maxMana = Objective.create('max_mana')
export const manaRegen = Objective.create('mana_regen')
export const manaRegenTimer = Objective.create('mana_regen_timer')

MCFunction('mana_manager', () => {
    execute.as(SessionPlayer).run(() => {
        // if their mana is below max
        _.if(mana('@s').lessThan(maxMana('@s')), () => {
            _.if(manaRegenTimer('@s').lessThanOrEqualTo(0), () => {
                mana('@s').add(1)
                manaRegenTimer('@s').set(Variable(20).dividedBy(manaRegen('@s')))
            })
            
            // display mana actionbar
            title('@s').actionbar([ 'Mana: ', mana('@s'), ' / ', maxMana('@s') ])

            manaRegenTimer('@s').remove(1)
        })

    })
}, {
    runEveryTick: true
})