// spells/arcane/shockwave.ts
import { _, abs, damage, execute, functionCmd, particle, rel, raw, tp, rotate, loc } from 'sandstone'
import { createProjectileSpell, spawnRingOfBolts } from '../Common'

createProjectileSpell({
    schoolId: 'arcane',
    spellId: 'shockwave',
    spawn: (tag) => spawnRingOfBolts(tag, 12, 16),
    projectile: {
        lifetime: 16,
        move: () => {
            rotate('@s', rel(2, 0))
            tp('@s', loc(0, 0, 0.5))
        },
        particles: () => {
            particle('dust_color_transition{from_color:[0.63,0.1,.74],to_color:[0.29,0.29,0.29],scale:1}', rel(0, 0.5, 0), abs(0.05, 0.05, 0.05), 0.01, 1, 'force')
        },
        hitWidth: 1.5,
        hitHeight: 2,
        onHit: () => {
            raw(`rotate @s facing entity @p feet`)
            raw(`rotate @s ~ -60`)
            execute.rotated().as('@s').run(() => {
                raw("scoreboard players set $strength player_motion.api.launch 15000")
                functionCmd('player_motion:api/launch_looking')
            })
            damage('@s', 1, 'magic')
        },
        destroyOnHit: true
    }
})