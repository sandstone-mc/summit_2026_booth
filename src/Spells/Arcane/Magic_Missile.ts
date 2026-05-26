import { Label, MCFunction, Objective, Selector, Tag, _, abs, damage, data, Data, execute, kill, loc, particle, rel, rotate, say, summon, Variable, tellraw, tp, raw } from "sandstone";
import { createProjectileSpell, spawnSingleBolt } from "../Common";

createProjectileSpell({
  schoolId: 'arcane', spellId: 'magic_missile',
  spawn: (tag) => spawnSingleBolt(tag, 60),
  projectile: {
    lifetime: 60,
    move: () => {
        const nearest = Selector('@e', { 
            type: '#arcane_arts:targetable', 
            limit: 1, 
            sort: 'nearest', 
            distance: [0, 20] 
        });

        execute
            .if.entity(nearest)
            .run(() => {
                raw(`rotate @s facing entity ${nearest} feet`);
                tp('@s', loc(0, 0, 0.4));
            });

        execute
            .unless.entity(nearest)
            .run(() => tp('@s', loc(0, 0, 0.4)));
    },
    particles: () => particle('dust_color_transition{from_color:[0.63,0.1,.74],to_color:[0.29,0.29,0.29],scale:1}', rel(0, 0, 0), abs(0.05, 0.05, 0.05), 0.01, 3, 'force'),
    onHit: () => { 
        damage('@s', 4, 'magic'); 
        particle('reverse_portal', rel(0, 0, 0), abs(0.05, 0.05, 0.05), 0.2, 30, 'force')
    },
    blockCollision: false,
  }
});