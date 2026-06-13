// spells/nature/thorn_volley.ts
import { abs, damage, execute, loc, MCFunction, particle, rel, Selector, tp, Variable } from "sandstone";
import { castSpell, spellMeta, createProjectileSpell, spawnRingOfBolts, spawnConeOfBolts } from "../Common";
import { Entangled } from "../../StatusEffects";

const meta = spellMeta("nature", "thorn_volley");

createProjectileSpell({
    schoolId: 'nature',
    spellId: 'thorn_volley',
    spawn: (tag) => spawnConeOfBolts(tag, 5, 30, 30),
    projectile: {
        lifetime: 30,
        destroyOnHit: true,
        blockCollision: true,
        move: () => tp('@s', loc(0, 0, 0.6)),
        particles: () => {
            particle('crit', rel(0, 0, 0), abs(0.05, 0.05, 0.05), 0.01, 1, 'force');
            particle('spore_blossom_air', rel(0, 0, 0), abs(0.05, 0.05, 0.05), 0, 1, 'force');
        },
        onHit: () => {
            damage('@s', 2, 'thorns');
            Entangled.apply(Variable(2));
            particle('block{block_state:"minecraft:oak_leaves"}', rel(0, 0, 0), abs(0.3, 0.3, 0.3), 0.1, 10, 'force');
        },
        onExpire: () => {
            particle('block{block_state:"minecraft:oak_leaves"}', rel(0, 0, 0), abs(0.2, 0.2, 0.2), 0.05, 5, 'force');
        }
    }
});