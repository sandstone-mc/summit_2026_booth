import { abs, damage, loc, particle, rel, tp, Variable } from "sandstone";
import { Burning } from "../../StatusEffects"
import { createProjectileSpell, spawnSingleBolt } from "../Common";

createProjectileSpell({
  schoolId: 'fire', spellId: 'firebolt',
  spawn: (tag) => spawnSingleBolt(tag, 50),
  projectile: {
    lifetime: 50,
    destroyOnHit: true,
    blockCollision: true,
    move: () => tp('@s', loc(0, 0, 1.2)),
    particles: () => particle('flame', rel(0, 0, 0), abs(0.1, 0.1, 0.1), 0.01, 5, 'force'),
    onHit: () => { 
      damage('@s', 2, 'on_fire'); 
      Burning.apply(Variable(2)); 
    },
  }
});