import { _, MCFunction, Variable, type MCFunctionClass } from 'sandstone'
import { playerDbTick } from './PlayerDB'
import { manaManagerTick } from './player_handler'
import { spellbookTriggersTick } from './spellbook'
import { spellUpdaters } from './Spells/Common'
import { statusUpdaters } from './StatusEffects/Common'
import { updateStorms } from './Spells/Ice/Blizzard'
import { updateStaticField } from './Spells/Lightning/Static_Field'
import { showcaseActive } from '../main/showcase'

// preserves the original 5t/10t cadence those two updates ran at under `runEvery`
const tickCounter = Variable(0, 'magic.tick_counter')

// everything the magic section needs ticking except the SummitShowcase entry/session
// detection itself (that one has to run unconditionally to notice players walking in)
export const magicTick = MCFunction('sections/magic/tick', (self: MCFunctionClass) => {
    tickCounter.add(1)

    playerDbTick()
    manaManagerTick()
    spellbookTriggersTick()

    _.if(showcaseActive.equals(1), () => {
        for (const update of spellUpdaters) update()
        for (const update of statusUpdaters) update()
    })

    _.if(tickCounter.moduloBy(5).equalTo(0), () => {
        updateStorms()
    })
    _.if(tickCounter.moduloBy(10).equalTo(0), () => {
        updateStaticField()
    })

    self.schedule.function('1t', 'replace')
}, { lazy: true })

export function startMagicTick() {
    tickCounter.set(0)
    magicTick()
}

export function stopMagicTick() {
    magicTick.schedule.clear()
}
