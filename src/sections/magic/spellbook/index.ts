// spellbook/index.ts
import { advancement, MCFunction, Selector, _, execute, scoreboard, DataVariable, data, DataPointClass, Macro, raw, Score, say, functionCmd } from 'sandstone'
import { SpellLibrary, SpellSchool, Spell, SchoolID, SpellIDS } from './SpellLibrary'
import { setSchoolTrigger, setSpellTrigger, temps } from '../pack_setup'

import { getSelf, io, saveSelf } from "../PlayerDB";
      
const SetSchool = MCFunction('spellbook/set_school', [], (_loop: any, newSchool: Score) => {
  raw(`$data modify storage arcane_arts:io ${io.select('current_school').path} set from storage arcane_arts:ids schools.$(param_0).name`)
  raw(`$data modify storage arcane_arts:io ${io.select('current_school_uid').path} set value $(param_0)`)
  raw(`$data modify storage arcane_arts:io ${io.select('selected_spell').path} set from storage arcane_arts:ids schools.$(param_0).spells.0`)
});

const $ = Macro;
const SetSpell = MCFunction('spellbook/set_spell', [], (_loop: any, newSpell: Score) => {
  raw(`$data modify storage arcane_arts:temps macro.spellID set value $(param_0)`)
  raw(`data modify storage arcane_arts:temps macro.schoolID set from storage arcane_arts:io data.current_school_uid`)
  
  functionCmd(MCFunction('spellbook/set_spell/macro', [], () => {
    // raw(`$say $(spellID) $(schoolID)`)
    raw(`$data modify storage arcane_arts:io ${io.select('selected_spell').path} set from storage arcane_arts:ids schools.$(schoolID).spells.$(spellID)`)
  }), 'with', 'storage', 'arcane_arts:temps', 'macro');
});


MCFunction('spellbook/triggers', () => {
  execute.as('@a').run(() => {
    _.if(setSchoolTrigger('@s').greaterOrEqualThan(0), () => {
      getSelf();
      SetSchool(setSchoolTrigger('@s'));
      saveSelf();

      setSchoolTrigger('@s').set(-1);
      scoreboard.players.enable('@s', setSchoolTrigger);
    }).elseIf(setSpellTrigger('@s').greaterOrEqualThan(0), () => {
      getSelf();
      SetSpell(setSpellTrigger('@s'));
      saveSelf();

      setSpellTrigger('@s').set(-1);
      scoreboard.players.enable('@s', setSpellTrigger);
    })
  });
}, {
  runEveryTick: true
})