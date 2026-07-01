// spells/arcane/shockwave.ts
import { Label, MCFunction, Objective, Selector, _, abs, damage, execute, functionCmd, kill, particle, rel, raw, tp, tellraw, Variable, rotate, loc } from "sandstone";
import { castSpell, spellMeta, Caster, Lifetime } from "../Common";

const SCHOOLID = "arcane";
const SPELLID = "shockwave";
const { spell, spellPath } = spellMeta(SCHOOLID, SPELLID);

const Wave = Label(`spell.${SCHOOLID}.${SPELLID}.wave`);
const waveCount = 12; // number of projectiles in the ring
const waveRings = 2;  // how many rings expand outward

const spawnWave = MCFunction(`${spellPath}/spawn`, () => {
    for (let ring = 0; ring < waveRings; ring++) {
        for (let i = 0; i < waveCount; i++) {
            const angle = (i / waveCount) * 360;
            execute.summon('minecraft:marker').run(() => {
                Wave('@s').add();
                Lifetime('@s').set(ring * 4); // stagger rings so they expand outward
                tp('@s', rel(0, 0, 0));
                rotate('@s', abs(angle, 0));
            });
        }
    }
});

MCFunction(`${spellPath}/update`, () => {
    execute.as(Selector('@e', {
        type: 'minecraft:marker',
        tag: Wave
    })).at('@s').run(() => {
        Lifetime('@s').remove(1);

        _.if(Lifetime('@s').lessOrEqualThan(0), () => {
            // Visual ring
            particle('dust_color_transition{from_color:[0.63,0.1,.74],to_color:[0.29,0.29,0.29],scale:1}', rel(0, 0.5, 0), abs(0.05, 0.05, 0.05), 0.01, 1, 'force');

            rotate('@s', rel(2, 0));
            tp('@s', loc(0, 0, 0.5));

            // Push nearby entities away
            execute.as(Selector('@e', {
                distance: [0, 1.5],
                type: '#arcane_arts:targetable'
            })).run(() => {
                // Face toward wave marker then invert — or use facing with wave position
                raw(`rotate @s facing entity @p feet`);
                raw(`rotate @s ~ -60`);
                // Now @s faces the wave, so negate velocity to push away
                execute.rotated().as('@s').run(() => {
                    functionCmd("pl_impulse:execute", { func:"motion", in: { velocity:1.3 } })
                })
                damage('@s', 1, 'magic');
            });

            // Kill after travelling far enough
            _.if(Lifetime('@s').lessThan(-20), () => {
                kill('@s');
            });
        });
    });
}, { runEveryTick: true });

MCFunction(`${spellPath}/cast`, () => {
    castSpell(SPELLID, SCHOOLID, () => {
        spawnWave();
    });
});