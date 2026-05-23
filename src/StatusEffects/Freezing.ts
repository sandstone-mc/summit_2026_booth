import { Label, MCFunction, Objective, Selector, _, damage, execute, particle, rel, abs, Advancement, fill, summon, kill, Score, Macro, raw, Variable } from "sandstone";

const EffectName = "freezing";

const statusTag = Label(`status.${EffectName}`);
const statusTime = Objective.create(`status.${EffectName}_timer`)

const $ = Macro;
export const apply = MCFunction(`status/${EffectName}/apply`, (_loop: any, duration: Score) => {
    // statusTime('@s').set(duration);
    // raw(`$scoreboard players set @s ${statusTime.name} $(duration)`)
    
    $.scoreboard.players.set('@s', statusTime.name, duration);

    statusTime('@s').multiply(20);
    statusTag('@s').add();
})

const end = MCFunction(`status/${EffectName}/end`, () => {
    statusTime('@s').reset();
    statusTag('@s').remove();
})

const freezeAdvancement = Advancement(`status/${EffectName}`, {
    "criteria": {
        "tick":{
            "trigger": "minecraft:tick"
        }
    },
    "rewards": {
        "function": `magic:status/${EffectName}/tryfreeze`
    }
})

MCFunction(`status/${EffectName}/tryfreeze`, () => {
    freezeAdvancement.revoke('@s');

    _.if(statusTag('@s'), () => {
        execute.store.success(statusTime('#snow')).run(() => {
            fill(rel(0, 1, 0), rel(0, 1, 0), 'powder_snow').replace('air');
        })

        _.if(statusTime('#snow').equalTo(1), () => {
            summon('marker', rel(0, 1, 0), {
                Tags: [ `magic.status.${EffectName}.snow` ]
            })
        })
    })
})

MCFunction(`status/${EffectName}/update`, () => {
    // execute at @e[tag=snow] run fill ~ ~ ~ ~ ~ ~ air replace powder_snow

    execute.as(Selector('@e', {
        type: 'marker',
        tag: `magic.status.${EffectName}.snow`
    })).at('@s').run(() => {
        fill(rel(0,0,0), rel(0,0,0), 'air').replace('powder_snow');
        kill('@s');
    })
        
    execute.as(Selector('@e', {
        tag: statusTag
    })).at('@s').run(() => {
        particle('snowflake', rel(0, 1, 0), abs(0.1, 0.25, 0.1), 0.01, 2, 'force')

        _.if(statusTime('@s').lessOrEqualThan(0), () => {
            end();
        })

        _.if(statusTime('@s').moduloBy(20).equalTo(0), () => {
            damage('@s', 1, 'freeze')
            particle('snowflake', rel(0, 1, 0), abs(0.1, 0.25, 0.1), 0.2, 20, 'force')
        })
        
        statusTime('@s').remove(1);
    })
}, {
    runEveryTick: true
})