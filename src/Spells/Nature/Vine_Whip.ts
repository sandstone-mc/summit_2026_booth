// spells/nature/vine_whip.ts
import { abs, damage, execute, MCFunction, particle, rel, Selector, tp, Variable, raw, Label, say, rotate } from "sandstone";
import { castSpell, spellMeta } from "../Common";
import { checkHit } from "../../utils/hitDetection";
import { fireRaycast } from "../../utils/raycast";

const meta = spellMeta("nature", "vine_whip");

// Raycast to find target, then pull them to caster
const whipRaycast = fireRaycast(meta.spellPath, {
    maxSteps: 30,
    stepSize: 0.5,
    onStart: () => {
        tp('@s', rel(0, 1.62, 0));
    },
    onStep: () => {
        particle('end_rod', rel(0, 0, 0), abs(0.05, 0.05, 0.05), 0.01, 2, 'force');
        checkHit({
            width: 1.5,
            height: 3,
            onHit: () => {
                // face toward caster then impulse forward
                execute.at('@a[sort=nearest,limit=1]').run(() => {
                    raw(`rotate @s facing ~ ~1 ~`);
                    say("h")
                    raw(`function pl_impulse:execute {func:"motion", in:{velocity:2}}`);
                });
            }
        });
    }
});

MCFunction(`${meta.spellPath}/cast`, () => {
    castSpell("vine_whip", "nature", () => {
        whipRaycast();
    });
});