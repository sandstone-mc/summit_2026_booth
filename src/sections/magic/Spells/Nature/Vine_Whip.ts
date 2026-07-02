import { abs, damage, Label, MCFunction, particle, raw, rel, tp, functionCmd } from 'sandstone'
import { castSpell, spellMeta } from '../Common'
import { checkHit } from '../../utils/hitDetection'
import { fireRaycast } from '../../utils/raycast'

const meta = spellMeta('nature', 'vine_whip')
const VineWhipCaster = Label('spell.nature.vine_whip.caster')

const whipRaycast = fireRaycast(meta.spellPath, {
    maxSteps: 10,
    stepSize: 0.5,
    onStart: () => {
        tp('@s', rel(0, 1.62, 0))
    },
    onStep: () => {
        particle('spore_blossom_air', rel(0, 0, 0), abs(0.05, 0.05, 0.05), 0.01, 1, 'force')
        particle('minecraft:tinted_leaves{color:[0,1,0,1]}', rel(0, 0, 0), abs(0.05, 0.05, 0.05), 0.01, 1, 'force')
        checkHit({
            width: 1.5,
            height: 3,
            onHit: () => {
                damage('@s', 1)
                raw(`rotate @s facing entity @a[tag=sandstone_summit_booth.${VineWhipCaster.name},limit=1] eyes`)
                raw("scoreboard players set $strength player_motion.api.launch 15000")
                functionCmd('player_motion:api/launch_looking')
            }
        })
    }
})

MCFunction(`sections/magic/${meta.spellPath}/cast`, () => {
    castSpell('vine_whip', 'nature', () => {
        VineWhipCaster('@s').add()
        whipRaycast()
        VineWhipCaster('@s').remove()
    })
})
