import { _, execute, MCFunction, Objective, type Score, title, Variable } from 'sandstone'
import { type JSONTextComponent } from 'sandstone/arguments'
import { getSelf, saveSelf, io } from './PlayerDB'
import { SessionPlayer, SessionTimer } from './SummitShowcase/ShowcaseState'
import { SpellLibrary } from './spellbook/SpellLibrary'

export const mana = Objective.create('mana')
export const maxMana = Objective.create('max_mana')
export const manaRegen = Objective.create('mana_regen')
export const manaRegenTimer = Objective.create('mana_regen_timer')

export const spellDisplayTimer = Objective.create('spell_display_timer')
export const SPELL_DISPLAY_TICKS = 60

function scoreText(score: Score, color: string): JSONTextComponent {
    return { score: { name: `${score.target}`, objective: score.objective.name }, color } as JSONTextComponent
}

MCFunction('sections/magic/mana_manager', () => {
    execute.as(SessionPlayer).run(() => {
        // if their mana is below max, regen it
        _.if(mana('@s').lessThan(maxMana('@s')), () => {
            _.if(manaRegenTimer('@s').lessThanOrEqualTo(0), () => {
                mana('@s').add(1)
                manaRegenTimer('@s').set(Variable(20).dividedBy(manaRegen('@s')))
            })

            manaRegenTimer('@s').remove(1)
        })

        _.if(spellDisplayTimer('@s').greaterThan(0), () => {
            spellDisplayTimer('@s').remove(1)

            const schoolUid = Variable()
            schoolUid.set(io.select('current_school_uid'))
            const spellUid = Variable()
            spellUid.set(io.select('selected_spell_uid'))

            _.switch(schoolUid, Object.values(SpellLibrary).map(school => ['case', school.uid, () => {
                _.switch(spellUid, Object.values(school.spells).map(spell => ['case', spell.uid, () => {
                    title('@s').actionbar([{ text: '✦ ', color: 'yellow' }, { text: spell.name, color: 'white', bold: true }])
                }] as const))
            }] as const))
        }).else(() => {
            const secondsLeft = Variable(SessionTimer).dividedBy(20)
            const minutesLeft = Variable(secondsLeft).dividedBy(60)
            const secsRemainder = Variable(secondsLeft).moduloBy(60)

            const manaText: JSONTextComponent[] = [
                { text: 'Mana: ', color: 'aqua' },
                scoreText(mana('@s'), 'aqua'),
                { text: ' / ', color: 'aqua' },
                scoreText(maxMana('@s'), 'aqua'),
            ]

            _.if(secsRemainder.lessThan(10), () => {
                title('@s').actionbar([...manaText, { text: '   Time: ', color: 'light_purple' }, scoreText(minutesLeft, 'light_purple'), { text: ':0', color: 'light_purple' }, scoreText(secsRemainder, 'light_purple')])
            }).else(() => {
                title('@s').actionbar([...manaText, { text: '   Time: ', color: 'light_purple' }, scoreText(minutesLeft, 'light_purple'), { text: ':', color: 'light_purple' }, scoreText(secsRemainder, 'light_purple')])
            })
        })
    })
}, {
    // TODO
    runEveryTick: true
})