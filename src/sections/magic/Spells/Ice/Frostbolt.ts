import { Label, MCFunction, Objective, Selector, Tag, _, abs, damage, data, Data, execute, kill, loc, particle, rel, rotate, say, summon, Variable, tellraw, tp } from "sandstone";
import { Freezing } from "../../StatusEffects"
import { createProjectileSpell, spawnSingleBolt } from "../Common";

createProjectileSpell({
  schoolId: 'ice', spellId: 'frostbolt',
  spawn: (tag) => spawnSingleBolt(tag, 50),
  projectile: {
    lifetime: 50,
    destroyOnHit: true,
    blockCollision: true,
    move: () => tp('@s', loc(0, 0, 1.2)),
    particles: () => particle('snowflake', rel(0, 0, 0), abs(0.1, 0.1, 0.1), 0.01, 5, 'force'),
    onHit: () => { 
      damage('@s', 1, 'freeze'); 
      Freezing.apply(Variable(2)); 
    },
  }
});