import { abs, loc, particle, rel, tp, Variable } from "sandstone";
import { createProjectileSpell, spawnRingOfBolts } from "../Common";
import { Entangled } from "../../StatusEffects";

createProjectileSpell({
    schoolId: 'nature',
    spellId: 'entangle',
    spawn: (tag) => spawnRingOfBolts(tag, 12, 16),
    projectile: {
        lifetime: 16,
        move: () => tp('@s', loc(0, 0, 0.5)),
        particles: () => {
            particle('spore_blossom_air', rel(0, 0, 0), abs(0.1, 0.1, 0.1), 0, 1, 'force');
            particle('minecraft:tinted_leaves{color:[0,1,0,1]}', rel(0, 0, 0), abs(0.05, 0.05, 0.05), 0, 1, 'force');
        },
        hitWidth: 1.5,
        hitHeight: 2,
        onHit: () => {
            Entangled.apply(Variable(5));
            particle('spore_blossom_air', rel(0, 1, 0), abs(0.3, 0.5, 0.3), 0, 10, 'force');
            particle('minecraft:tinted_leaves{color:[0,1,0,1]}', rel(0, 1, 0), abs(0.2, 0.3, 0.2), 0.05, 8, 'force');
        },
    }
});
