import { MCFunction, Data, Objective, _, data, tellraw, scoreboard, Tag } from 'sandstone'

export const setSchoolTrigger = Objective.create('set_school_trigger', 'trigger')
export const setSpellTrigger = Objective.create('set_spell_trigger', 'trigger')

export const temps = Data('storage', 'sandstone_summit_booth:temps')

MCFunction('sections/magic/initialize', () => {
    // tellraw('@a', ['reloaded'])

    scoreboard.players.enable('@a', setSchoolTrigger)
    scoreboard.players.enable('@a', setSpellTrigger)
}, {
    runOnLoad: true
})

// Tag('function', 'minecraft:load', [ '#load:load', 'zz.pl_impulse:load' ])