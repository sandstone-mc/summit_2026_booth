import { _, MCFunction, Variable, type MCFunctionClass } from 'sandstone'
import { playerDbTick } from './PlayerDB'
import { manaManagerTick } from './player_handler'
import { spellbookTriggersTick } from './spellbook'
import { spellUpdatersBySchool } from './Spells/Common'
import { statusUpdatersBySchool } from './StatusEffects/Common'
import { updateStorms } from './Spells/Ice/Blizzard'
import { updateStaticField } from './Spells/Lightning/Static_Field'
import { SpellLibrary, type SchoolID } from './spellbook/SpellLibrary'
import { showcaseActive } from '../main/showcase'

const SCHOOL_IDS = Object.keys(SpellLibrary) as SchoolID[]

// everything the magic section needs ticking except the SummitShowcase entry/session
// detection itself (that one has to run unconditionally to notice players walking in)
export const magicTick = MCFunction('sections/magic/tick', (self: MCFunctionClass) => {
    _.if(showcaseActive.equals(1), () => {
        playerDbTick()
        manaManagerTick()
        spellbookTriggersTick()
    })

    self.schedule.function('1t', 'replace')
}, { lazy: true })

export function startMagicTick() {
    magicTick()
}

export function stopMagicTick() {
    magicTick.schedule.clear()
}

const schoolTickCounter: Record<SchoolID, ReturnType<typeof Variable>> = Object.fromEntries(
    SCHOOL_IDS.map(schoolId => [schoolId, Variable(0, `magic.tick_counter.${schoolId}`)]),
) as Record<SchoolID, ReturnType<typeof Variable>>

const schoolTickLoops: Record<SchoolID, MCFunctionClass> = Object.fromEntries(
    SCHOOL_IDS.map(schoolId => {
        const loop = MCFunction(`sections/magic/tick/school/${schoolId}`, (self: MCFunctionClass) => {
            for (const update of spellUpdatersBySchool[schoolId]) update()
            for (const update of statusUpdatersBySchool[schoolId]) update()

            if (schoolId === 'ice' || schoolId === 'lightning') {
                const counter = schoolTickCounter[schoolId]
                counter.add(1)
                if (schoolId === 'ice') {
                    _.if(counter.moduloBy(5).equalTo(0), () => {
                        updateStorms()
                    })
                } else {
                    _.if(counter.moduloBy(10).equalTo(0), () => {
                        updateStaticField()
                    })
                }
            }

            self.schedule.function('1t', 'replace')
        }, { lazy: true })
        return [schoolId, loop]
    }),
) as Record<SchoolID, MCFunctionClass>

export function startSchoolTick(schoolId: SchoolID) {
    schoolTickCounter[schoolId].set(0)
    schoolTickLoops[schoolId]()
}

export function stopAllSchoolTicks() {
    for (const schoolId of SCHOOL_IDS) {
        schoolTickLoops[schoolId].schedule.clear()
    }
}
