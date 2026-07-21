// spellbook/index.ts
import { MCFunction, _, execute, scoreboard, Score, Variable, NBT } from 'sandstone'
import { setSchoolTrigger } from '../pack_setup'

import { getSelf, io, saveSelf } from '../PlayerDB'
import { SessionPlayer } from '../SummitShowcase/ShowcaseState'
import { SpellLibrary } from './SpellLibrary'

const SPELLS_PER_SCHOOL = 3

function applySchool(schoolUid: Score) {
  _.switch(schoolUid, Object.values(SpellLibrary).map(school => ['case', school.uid, () => {
    const firstSpell = Object.values(school.spells).find(spell => spell.uid === 0)!
    io.select('current_school').set(school.id)
    io.select('current_school_uid').set(NBT.int(school.uid))
    io.select('selected_spell').set(firstSpell.id)
    io.select('selected_spell_uid').set(NBT.int(0))
  }] as const))
}

const CycleSchoolUid = Variable()
const CycleSpellUid = Variable()

export const cycleSpell = MCFunction('sections/magic/spellbook/cycle_spell', () => {
  getSelf()

  CycleSchoolUid.set(io.select('current_school_uid'))
  CycleSpellUid.set(io.select('selected_spell_uid'))
  CycleSpellUid.add(1)
  const wrappedSpellUid = CycleSpellUid.moduloBy(SPELLS_PER_SCHOOL)

  _.switch(CycleSchoolUid, Object.values(SpellLibrary).map(school => ['case', school.uid, () => {
    _.switch(wrappedSpellUid, Object.values(school.spells).map(spell => ['case', spell.uid, () => {
      io.select('selected_spell').set(spell.id)
      io.select('selected_spell_uid').set(NBT.int(spell.uid))
    }] as const))
  }] as const))

  saveSelf()
})

MCFunction('sections/magic/spellbook/triggers', () => {
  execute.as(SessionPlayer).run(() => {
    _.if(setSchoolTrigger('@s').greaterThanOrEqualTo(0), () => {
      getSelf()
      applySchool(setSchoolTrigger('@s'))
      saveSelf()

      setSchoolTrigger('@s').set(-1)
      scoreboard.players.enable('@s', setSchoolTrigger)
    })
  })
}, {
  runEveryTick: true
})
