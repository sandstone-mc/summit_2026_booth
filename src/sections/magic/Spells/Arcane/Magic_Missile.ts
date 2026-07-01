import { Label, MCFunction, Objective, Selector, Tag, _, abs, damage, data, Data, execute, kill, loc, particle, rel, rotate, say, summon, Variable, tellraw, tp, raw } from 'sandstone'
import { Caster, createProjectileSpell, spawnSingleBolt, spellMeta } from '../Common'
import { fireRaycast } from '../../utils/raycast'
import { checkHit } from '../../utils/hitDetection'

const Target = Label('spell.arcane.magic_missile.target')
const meta = spellMeta('arcane', 'magic_missile')

const target = Selector('@e', { 
    type: '#arcane_arts:targetable', 
    limit: 1, 
    sort: 'nearest',
    tag: Target
})

createProjectileSpell({
  schoolId: 'arcane', spellId: 'magic_missile',
  spawn: (tag) => spawnSingleBolt(tag, 60),
  projectile: {
    lifetime: 60,
    destroyOnHit: true,
    onStart: () => {
        const castTarget = fireRaycast(`${meta.spellPath}/target`, {
            maxSteps: 40,
            stepSize: 0.5,
            onStart: () => {
                tp('@s', rel(0, 1.62, 0))
            },
            onStep: () => {
                checkHit({
                    onHit: () => {
                        Target('@s').add()

                        execute.if.entity(target).at(target).run(() => {
                            particle('end_rod', rel(0, 0, 0), abs(0.6, 1, 0.6), 0, 20, 'normal', Selector('@a', {
                                tag: Caster,
                                limit: 1,
                                sort: 'nearest'
                            }))
                        })
                    }
                })
            }
        })

        castTarget()

        tp('@s', rel(0, 1.62, 0))
    },
    move: () => {
        

        execute
            .if.entity(target)
            .run(() => {
                raw(`rotate @s facing entity ${target} eyes`)
                tp('@s', loc(0, 0, 0.4))
            })

        execute
            .unless.entity(target)
            .run(() => tp('@s', loc(0, 0, 0.4)))
    },
    particles: () => particle('dust_color_transition{from_color:[0.63,0.1,.74],to_color:[0.29,0.29,0.29],scale:1}', rel(0, 0, 0), abs(0.05, 0.05, 0.05), 0.01, 3, 'force'),
    onHit: () => { 
        damage('@s', 4, 'magic'); 
        particle('reverse_portal', rel(0, 0, 0), abs(0.05, 0.05, 0.05), 0.2, 30, 'force')
        Target('@s').remove()
    },
    onExpire: () => {
      execute.as(target).run(() => {
        Target('@s').remove()
      })  
    },
    blockCollision: true,
  }
});