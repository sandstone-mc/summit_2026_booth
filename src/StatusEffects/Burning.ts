import { createStatusEffect } from "./Common";

import { Label, MCFunction, Objective, Selector, _, Macro, damage, execute, particle, rel, abs, Score } from "sandstone";

const status = createStatusEffect({
    name: "burning",
    damageType: "on_fire",
    damageAmount: 1,
    damageInterval: 20,
    particles: () => {
        particle('flame', rel(0, 1, 0), abs(0.1, 0.25, 0.1), 0.01, 5, 'force')
    },
    onApply: () => {},
    onEnd: () => {},
    onTick: () => {},
});

export default status;