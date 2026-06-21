import { abs, damage, loc, particle, rel, rotate, tp, Variable } from "sandstone";
import { Burning } from "../../StatusEffects"
import { createProjectileSpell, spawnRingOfBolts } from "../Common";

createProjectileSpell({
  schoolId: 'fire', spellId: 'heatwave',
  spawn: (tag) => spawnRingOfBolts(tag, 20, 75),
  projectile: {
    lifetime: 75,
    move: () => {
      rotate('@s', rel(5, 0));
      tp('@s', loc(0, 0, 0.2));
    },
    particles: () => particle('flame', rel(0, 0, 0), abs(0.05, 0, 0.05), 0.01, 2, 'force'),
    onHit: () => { damage('@s', 1, 'on_fire'); Burning.apply(Variable(2)); },
  }
});