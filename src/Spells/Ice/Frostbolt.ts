import { Label, MCFunction, Objective, Selector, Tag, _, abs, damage, data, Data, execute, kill, loc, particle, rel, rotate, say, summon, Variable, tellraw, tp } from "sandstone";
import { SpellLibrary, Spell, SchoolID } from "../../spellbook/SpellLibrary";
import * as player from '../../player_handler'
import * as Freezing from '../../StatusEffects/Freezing'
import { Lifetime, Caster } from '../Common'

const SCHOOLID: SchoolID = "ice";
const SPELLID: string = "frostbolt";
const spell: Spell = SpellLibrary[SCHOOLID].spells[SPELLID];

const spellPath = `spells/${SCHOOLID}/${SPELLID}`;

const Projectile = Label(`spell.${SCHOOLID}.${SPELLID}.bolt`);

const spawnBolt = MCFunction(`${spellPath}/spawn_bolt`, () => {
    execute.anchored('eyes').rotated.as('@s').run(() => {
        Caster('@s').add();

        execute.summon('minecraft:marker').run(() => {
            Projectile('@s').add();
            tp('@s', rel(0, 1, 0), rel(0, 0))
            Lifetime('@s').set(50);
            data.modify(Data('entity', '@s').select('data.owner')).set.from(Data('entity', Selector('@n', {
                tag: Caster
            })).select('UUID'));
        })

        Caster('@s').remove();
    })

})

MCFunction(`${spellPath}/update_bolts`, () => {
    const BoltSelector = Selector('@e', {
        type: 'minecraft:marker',
        tag: Projectile
    });

    execute.as(BoltSelector).at('@s').run(() => {
        particle('snowflake', rel(0, 0, 0), abs(0.1, 0.1, 0.1), 0.01, 5, 'force');
        tp('@s', loc(0, 0, 1.2));
        Lifetime('@s').remove(1);
        
        const toHit = Selector('@e', {
            distance: [0, 1]
        })

        execute.as(toHit).if.entity('@s').run(() => {
            damage('@s', 2, 'freeze');
            Freezing.apply(Variable(2));
        })

        _.if(Lifetime('@s').lessOrEqualThan(0), () => {
            kill('@s');
        })

        execute.unless.block(rel(0, 0, 0), '#minecraft:replaceable').run(() => {
            kill('@s');
            particle('explosion', rel(0, 0, 0), abs(0.1, 0.1, 0.1), 0.01, 5, 'force');
            
            execute.as(Selector('@e', {
                distance: [0, 4]
            })).run(() => {
                damage('@s', 3, 'on_fire');
            Freezing.apply(Variable(2));
            })
        })
    })
}, {
    runEveryTick: true
})

MCFunction(`${spellPath}/cast`, () => {
    _.if(player.mana('@s').greaterOrEqualThan(spell.mana_cost), () => {
        player.mana('@s').remove(spell.mana_cost);

        spawnBolt();
    }).else(() => {
        tellraw('@s', {
            color: "red",
            text: "Insufficient Mana"
        })
    })
})