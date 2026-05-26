import { Label, MCFunction, Objective, Selector, Tag, _, abs, damage, data, Data, execute, kill, loc, particle, rel, rotate, say, summon, Variable, tellraw, tp, effect } from "sandstone";
import { SpellLibrary, Spell, SchoolID } from "../../spellbook/SpellLibrary";
import * as player from '../../player_handler'
import { Freezing } from "../../StatusEffects"
import { Lifetime, Caster } from '../Common'

const SCHOOLID: SchoolID = "ice";
const SPELLID: string = "blizzard";
const spell: Spell = SpellLibrary[SCHOOLID].spells[SPELLID];

const spellPath = `spells/${SCHOOLID}/${SPELLID}`;

const Storm = Label(`spell.${SCHOOLID}.${SPELLID}.storm`);

const spawnStorm = MCFunction(`${spellPath}/spawn_bolt`, () => {
    execute.positioned('~ ~-1 ~').run(() => {
        Caster('@s').add();

        execute.summon('minecraft:marker').run(() => {
            Storm('@s').add();
            Lifetime('@s').set(200);
            data.modify(Data('entity', '@s').select('data.owner')).set.from(Data('entity', Selector('@n', {
                tag: Caster
            })).select('UUID'));
        })

        Caster('@s').remove();
    })
})

MCFunction(`${spellPath}/update_storms`, () => {
    const StormSelector = Selector('@e', {
        type: 'minecraft:marker',
        tag: Storm
    });

    execute.as(StormSelector).at('@s').run(() => {
        particle('snowflake', rel(0, 3, 0), abs(3, 3, 3), 0.0, 80, 'force');
        Lifetime('@s').remove(5);
    
        _.if(Lifetime('@s').lessOrEqualThan(0), () => {
            kill('@s');
        })

        execute.as(Selector('@e', { distance: [0, 6], type: '#arcane_arts:targetable' })).run(() => {
            damage('@s', 0.1, 'freeze');
            Freezing.apply(Variable(2));
            effect.give('@s', "minecraft:blindness", 2, 1, true);
        });
    })
}, {
    runEvery: 5
})

MCFunction(`${spellPath}/cast`, () => {
    _.if(player.mana('@s').greaterOrEqualThan(spell.mana_cost), () => {
        player.mana('@s').remove(spell.mana_cost);

        spawnStorm();
    }).else(() => {
        tellraw('@s', {
            color: "red",
            text: "Insufficient Mana"
        })
    })
})