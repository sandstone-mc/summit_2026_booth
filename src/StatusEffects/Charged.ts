// StatusEffects/Charged.ts
import { Label, MCFunction, Objective, Selector, _, damage, execute, particle, rel, abs, Macro, Score, raw, Variable, kill, say, tp } from "sandstone";
import { createStatusEffect } from "./Common";
import { createRaycast, fireRaycast } from "../utils/raycast";

const EffectName = "charged";
const rollScore = Objective.create(`status.${EffectName}_roll`, 'dummy');

const status = createStatusEffect({
    name: EffectName,
    damageType: 'lightning_bolt',
    damageAmount: 1,
    damageInterval: 20,
    particles: () => {
        particle('electric_spark', rel(0, 1, 0), abs(0.3, 0.5, 0.3), 0.05, 3, 'force');
        particle('end_rod', rel(0, 0.5, 0), abs(0.1, 0.3, 0.1), 0.01, 1, 'force');
    },
    onApply: () => {},
    onEnd: () => {},
    onTick: () => {
        const nearbyUncharged = Selector('@e', {
            type: '#magic:targetable',
            tag: [`!magic.${status.statusTag.name}`],
            distance: [0, 8],
            limit: 1,
            sort: 'nearest'
        });

        execute.as('@s').at('@s').as(nearbyUncharged).run(() => { say("h")})

        // Random roll
        raw(`execute store result score @s ${rollScore.name} run random value 1..5`);

        _.if(rollScore('@s').equalTo(1), () => {
            execute.if.entity(nearbyUncharged).run(() => {
                arcToTarget();

                execute.as(nearbyUncharged).run(() => {
                    status.apply(Variable(3));
                    damage('@s', 2, 'lightning_bolt');
                });
                damage('@s', 1, 'lightning_bolt');
            });
        });
    }
});

// Raycast toward nearest uncharged entity for the arc visual
const nearbyUncharged = Selector('@e', {
    type: '#magic:targetable',
    tag: [`!magic.${status.statusTag.name}`],
    distance: [0, 8],
    limit: 1,
    sort: 'nearest'
});

const arcRaycast = fireRaycast(`status/${EffectName}/arc`, {
    maxSteps: 20,
    stepSize: 0.4,
    onStep: () => {
        particle('electric_spark', rel(0, 0, 0), abs(0.05, 0.05, 0.05), 0.1, 2, 'force');
        particle('end_rod', rel(0, 0, 0), abs(0.02, 0.02, 0.02), 0.01, 1, 'force');
    },
    onHit: () => {
        particle('electric_spark', rel(0, 0, 0), abs(0.3, 0.8, 0.3), 0.1, 30, 'force');
    },
    onFinish: () => {
        say("done")
    },
    onStart: () => {
        raw(`rotate @s facing entity ${nearbyUncharged} feet`);
    }
});

const arcToTarget = MCFunction(`status/${EffectName}/arc_to_target`, () => {
    arcRaycast();

    // execute.summon('minecraft:marker').run(() => {
    //     const ArcActive = Label(`status.${EffectName}.arc_active`);
    //     ArcActive('@s').add();
    //     raw(`rotate @s facing entity ${nearbyUncharged} feet`);
    //     arcRaycast();
    //     kill('@s');
    // });
}, { lazy: true });

MCFunction('test', () => {
    status.apply(Variable(3));
})

export default status;