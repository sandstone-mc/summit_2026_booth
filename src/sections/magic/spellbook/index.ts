// spellbook/index.ts
import { MCFunction, _, execute, scoreboard, Macro, raw, Score, functionCmd } from 'sandstone'
import { setSchoolTrigger, setSpellTrigger } from '../pack_setup'

import { getSelf, io, saveSelf } from '../PlayerDB'
import { SessionPlayer } from '../SummitShowcase/ShowcaseState'
      
const SetSchool = MCFunction('sections/magic/spellbook/set_school', [], (_loop: any, newSchool: Score) => {
  raw(`$data modify storage sandstone_summit_booth:io ${io.select('current_school').path} set from storage sandstone_summit_booth:ids schools.$(param_0).name`)
  raw(`$data modify storage sandstone_summit_booth:io ${io.select('current_school_uid').path} set value $(param_0)`)
  raw(`$data modify storage sandstone_summit_booth:io ${io.select('selected_spell').path} set from storage sandstone_summit_booth:ids schools.$(param_0).spells.0`)
})

const $ = Macro
const SetSpell = MCFunction('sections/magic/spellbook/set_spell', [], (_loop: any, newSpell: Score) => {
  raw(`$data modify storage sandstone_summit_booth:temps macro.spellID set value $(param_0)`)
  raw(`data modify storage sandstone_summit_booth:temps macro.schoolID set from storage sandstone_summit_booth:io data.current_school_uid`)
  
  functionCmd(MCFunction('sections/magic/spellbook/set_spell/macro', [], () => {
    raw(`$data modify storage sandstone_summit_booth:io ${io.select('selected_spell').path} set from storage sandstone_summit_booth:ids schools.$(schoolID).spells.$(spellID)`)
  }), 'with', 'storage', 'sandstone_summit_booth:temps', 'macro')
})


MCFunction('sections/magic/spellbook/triggers', () => {
  execute.as(SessionPlayer).run(() => {
    _.if(setSchoolTrigger('@s').greaterThanOrEqualTo(0), () => {
      getSelf()
      SetSchool(setSchoolTrigger('@s'))
      saveSelf()

      setSchoolTrigger('@s').set(-1)
      scoreboard.players.enable('@s', setSchoolTrigger)
    }).elseIf(setSpellTrigger('@s').greaterThanOrEqualTo(0), () => {
      getSelf()
      SetSpell(setSpellTrigger('@s'))
      saveSelf()

      setSpellTrigger('@s').set(-1)
      scoreboard.players.enable('@s', setSpellTrigger)
    })
  })
}, {
  runEveryTick: true
})