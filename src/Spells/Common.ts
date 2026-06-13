import { Label, MCFunction, Objective, Selector, Tag, _, abs, damage, data, Data, execute, kill, raw, particle, rel, rotate, say, summon, Variable, tellraw, tp } from "sandstone"
import { SpellLibrary, Spell, SchoolID } from "../spellbook/SpellLibrary";

import * as player from '../player_handler'
import { checkHit } from "../utils/hitDetection";
export const Caster = Label('spell.caster');
export const Lifetime = Objective.create('lifetime');

export const TargetableTag = Tag("entity_type", "arcane_arts:targetable", [
    "minecraft:allay",
    "minecraft:armadillo",
    "minecraft:axolotl",
    "minecraft:bat",
    "minecraft:bee",
    "minecraft:blaze",
    "minecraft:bogged",
    "minecraft:breeze",
    "minecraft:camel",
    "minecraft:cat",
    "minecraft:cave_spider",
    "minecraft:chicken",
    "minecraft:cod",
    "minecraft:cow",
    "minecraft:creaking",
    "minecraft:creeper",
    "minecraft:dolphin",
    "minecraft:donkey",
    "minecraft:drowned",
    "minecraft:elder_guardian",
    "minecraft:ender_dragon",
    "minecraft:enderman",
    "minecraft:endermite",
    "minecraft:evoker",
    "minecraft:fox",
    "minecraft:frog",
    "minecraft:ghast",
    "minecraft:glow_squid",
    "minecraft:goat",
    "minecraft:guardian",
    "minecraft:hoglin",
    "minecraft:horse",
    "minecraft:husk",
    "minecraft:iron_golem",
    "minecraft:llama",
    "minecraft:magma_cube",
    "minecraft:mooshroom",
    "minecraft:mule",
    "minecraft:ocelot",
    "minecraft:panda",
    "minecraft:parrot",
    "minecraft:phantom",
    "minecraft:pig",
    "minecraft:piglin",
    "minecraft:piglin_brute",
    "minecraft:pillager",
    "minecraft:polar_bear",
    "minecraft:pufferfish",
    "minecraft:rabbit",
    "minecraft:ravager",
    "minecraft:salmon",
    "minecraft:sheep",
    "minecraft:shulker",
    "minecraft:silverfish",
    "minecraft:skeleton",
    "minecraft:skeleton_horse",
    "minecraft:slime",
    "minecraft:sniffer",
    "minecraft:snow_golem",
    "minecraft:spider",
    "minecraft:squid",
    "minecraft:stray",
    "minecraft:strider",
    "minecraft:tadpole",
    "minecraft:trader_llama",
    "minecraft:tropical_fish",
    "minecraft:turtle",
    "minecraft:vex",
    "minecraft:villager",
    "minecraft:vindicator",
    "minecraft:wandering_trader",
    "minecraft:warden",
    "minecraft:witch",
    "minecraft:wither",
    "minecraft:wither_skeleton",
    "minecraft:wolf",
    "minecraft:zoglin",
    "minecraft:zombie",
    "minecraft:zombie_horse",
    "minecraft:zombie_villager",
    "minecraft:zombified_piglin",
    // "minecraft:player",
])

export interface ProjectileOptions {
  // identity
  tag: ReturnType<typeof Label>;
  
  // movement - called every tick per projectile
  move: () => void;
  
  lifetime: number;
  
  // visuals - called every tick per projectile  
  particles: () => void;
  
  // hit detection
  hitWidth?: number;
  hitHeight?: number;
  onHit?: () => void;        // runs as the TARGET
  onExpire?: () => void;     // runs at projectile position
  
  onStart?: () => void;

  blockCollision?: boolean;
  destroyOnHit?: boolean;
}

export interface ProjectileSpellOptions {
  schoolId: SchoolID;
  spellId: string;
  
  // How to spawn projectile(s) - runs as caster
  spawn: (projectileTag: ReturnType<typeof Label>) => void;
  
  projectile: Omit<ProjectileOptions, 'tag'>;
}

export function createProjectileUpdater(
  path: string,
  opts: ProjectileOptions
) {
  return MCFunction(`${path}/update`, () => {
    const Proj = Selector('@e', { type: 'minecraft:marker', tag: opts.tag });
    execute.as(Proj).at('@s').run(() => {
      // Visuals
      opts.particles();
      
      // Movement
      opts.move();
      
      // Lifetime
      Lifetime('@s').remove(1);
      _.if(Lifetime('@s').lessOrEqualThan(0), () => {
        opts.onExpire?.();
        kill('@s');
      });

      // Hit detection
      if (opts.onHit) {
        checkHit({
          width: opts.hitWidth || 0.1,
          height: opts.hitHeight || 0.1,
          onHit: () => {
            opts.onHit!();

            if (opts.destroyOnHit) {
              execute.as(Selector('@e', {
                distance: [0, 2],
                tag: opts.tag
              })).run(() => {
                opts.onExpire?.();
                kill('@s');
              });
            }
          }
        });
      }

      // Block collision
      if (opts.blockCollision) {
        execute.unless.block(rel(0, 0, 0), '#minecraft:replaceable').run(() => {
          // particle('explosion', rel(0, 0, 0), abs(0.1, 0.1, 0.1), 0.01, 5, 'force');
          opts.onExpire?.();
          kill('@s');
        });
      }
    });
  }, { runEveryTick: true });
}

export function createProjectileSpell(opts: ProjectileSpellOptions) {
  const { spell, spellPath, label } = spellMeta(opts.schoolId, opts.spellId);
  const Projectile = label('projectile');

  const spawn = MCFunction(`${spellPath}/spawn`, () => {
    execute.anchored('eyes').rotated.as('@s').run(() => {
      Caster('@s').add();
      opts.spawn(Projectile);

      execute.as(Selector('@e', {
        tag: Projectile,
        distance: [0,1]
      })).run(() => {
        opts.projectile.onStart?.();
      });

      Caster('@s').remove();
    });
  });

  createProjectileUpdater(spellPath, {
    tag: Projectile,
    ...opts.projectile
  });

  MCFunction(`${spellPath}/cast`, () => {
    castSpell(opts.spellId, opts.schoolId, () => {
      spawn();
    });
  });
}

// Helper: spawn a single forward-moving bolt
export function spawnSingleBolt(
  projectileTag: ReturnType<typeof Label>,
  lifetime: number,
  offset = rel(0, 1, 0)
) {
  execute.summon('minecraft:marker').run(() => {
    projectileTag('@s').add();
    tp('@s', offset, rel(0, 0));
    Lifetime('@s').set(lifetime);
    data.modify(Data('entity', '@s').select('data.owner')).set.from(
      Data('entity', Selector('@n', { tag: Caster })).select('UUID')
    );
  });
}

// Helper: spawn N bolts in a ring (for heatwave-style)
export function spawnRingOfBolts(
  projectileTag: ReturnType<typeof Label>,
  count: number,
  lifetime: number
) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 360;
    execute.summon('minecraft:marker').run(() => {
      projectileTag('@s').add();
      Lifetime('@s').set(lifetime);
      rotate('@s', abs(angle, 0));
      data.modify(Data('entity', '@s').select('data.owner')).set.from(
        Data('entity', Selector('@n', { tag: Caster })).select('UUID')
      );
    });
  }
}

export function spawnConeOfBolts(
    projectileTag: ReturnType<typeof Label>,
    count: number,
    lifetime: number,
    spreadAngle = 30 
) {
    const halfSpread = spreadAngle / 2;
    const step = count === 1 ? 0 : spreadAngle / (count - 1);

    for (let i = 0; i < count; i++) {
        const yaw = -halfSpread + (step * i);
        execute.summon('minecraft:marker').run(() => {
            projectileTag('@s').add();
            Lifetime('@s').set(lifetime);
            data.modify(Data('entity', '@s').select('data.owner')).set.from(
                Data('entity', Selector('@n', { tag: Caster })).select('UUID')
            );

            rotate('@s', rel(yaw, 0));
            tp('@s', rel(0, 1.6, 0))
        });
    }
}

export function castSpell(spellId: string, schoolId: SchoolID, fn: () => void) {
  const spell = SpellLibrary[schoolId].spells[spellId];
  _.if(player.mana('@s').greaterOrEqualThan(spell.mana_cost), () => {
    player.mana('@s').remove(spell.mana_cost);
    fn();
  }).else(() => {
    tellraw('@s', { color: "red", text: "Insufficient Mana" });
  });
}

export function spellMeta(schoolId: SchoolID, spellId: string) {
  return {
    spell: SpellLibrary[schoolId].spells[spellId],
    spellPath: `spells/${schoolId}/${spellId}`,
    label: (suffix: string) => Label(`spell.${schoolId}.${spellId}.${suffix}`)
  };
}