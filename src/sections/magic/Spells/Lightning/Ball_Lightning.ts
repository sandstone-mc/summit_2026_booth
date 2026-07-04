import { _, abs, damage, particle, rel, Variable, tp, loc } from 'sandstone'
import { spellMeta, createProjectileSpell, spawnSingleBolt, Lifetime } from '../Common'
import { checkHit } from '../../utils/hitDetection'
import { Charged, Stunned } from '../../StatusEffects'

createProjectileSpell({
    schoolId: 'lightning',
    spellId: 'ball_lightning',
    spawn: (tag) => spawnSingleBolt(tag, 400),
    projectile: {
        lifetime: 400,
        blockCollision: true,
        move: () => tp('@s', loc(0, 0, 0.1)),
        particles: () => {
            // Periodic zap every 10 ticks
            _.if(Lifetime('@s').moduloBy(10).equalTo(0), () => {
                particle('electric_spark', rel(0, 0, 0), abs(1, 1, 1), 1, 20, 'force')
                checkHit({
                    width: 4,
                    height: 4,
                    onHit: () => {
                        particle('electric_spark', rel(0, 1, 0), abs(0.2, 0.5, 0.2), 0.1, 8, 'force')
                        damage('@s', 1, 'lightning_bolt')
                        Stunned.apply(Variable(1))
                        Charged.apply(Variable(3))
                    }
                })
            }).else(() => {
                particle('electric_spark', rel(0, 0, 0), abs(0.4, 0.4, 0.4), 0.05, 3, 'force')
                particle('end_rod', rel(0, 0, 0), abs(0.2, 0.2, 0.2), 0.02, 1, 'force')
            })
        },
        onHit: () => {
            
        },
        onExpire: () => {
            particle('electric_spark', rel(0, 0, 0), abs(1, 1, 1), 0.2, 50, 'force')
            checkHit({
                width: 6,
                height: 6,
                onHit: () => {
                    damage('@s', 6, 'lightning_bolt')
                    Stunned.apply(Variable(3))
                    Charged.apply(Variable(6))
                }
            })
        }
    }
});