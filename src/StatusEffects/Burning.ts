import { Label, MCFunction, Objective, Selector, _, Macro, damage, execute, particle, rel, abs, Score } from "sandstone";

const EffectName = "burning";

const statusTag = Label(`status.${EffectName}`);
const statusTime = Objective.create(`status.${EffectName}_timer`)

const $ = Macro;
export const apply = MCFunction(`status/${EffectName}/apply`, (_loop: any, duration: Score) => {
    $.scoreboard.players.set('@s', statusTime.name, duration);

    statusTime('@s').multiply(20);
    statusTag('@s').add();
})

const end = MCFunction(`status/${EffectName}/end`, () => {
    statusTime('@s').reset();
    statusTag('@s').remove();
})

MCFunction(`status/${EffectName}/update`, () => {
    execute.as(Selector('@e', {
        tag: statusTag
    })).at('@s').run(() => {
        particle('flame', rel(0, 1, 0), abs(0.1, 0.25, 0.1), 0.01, 5, 'force')

        _.if(statusTime('@s').lessOrEqualThan(0), () => {
            end();
        })

        _.if(statusTime('@s').moduloBy(20).equalTo(0), () => {
            damage('@s', 1, 'on_fire')
            particle('flame', rel(0, 1, 0), abs(0.1, 0.25, 0.1), 0.1, 20, 'force')
        })
        
        statusTime('@s').remove(1);
    })
}, {
    runEveryTick: true
})