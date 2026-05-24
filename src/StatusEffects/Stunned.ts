import { createStatusEffect } from "./Common";

import { Label, MCFunction, Objective, Selector, _, Macro, damage, execute, particle, rel, abs, Score, Variable, attribute } from "sandstone";

const status = createStatusEffect({
    name: "stunned",
    damageType: "generic",
    damageAmount: 0,
    damageInterval: 1000,
    particles: () => {
        particle('crit', rel(0, 1, 0), abs(0.1, 0.25, 0.1), 0.01, 1, 'force')
    },
    onApply: () => {
        attribute('@s', "minecraft:movement_speed").add(`magic:stunned`, -0.5, "add_multiplied_total");
    },
    onEnd: () => {
        attribute('@s', "minecraft:movement_speed").remove(`magic:stunned`);
    },
    onTick: () => {},
});

export default status;