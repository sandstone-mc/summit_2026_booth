import { Label, MCFunction, Objective, Selector, Tag, _, abs, damage, data, Data, execute, kill, loc, particle, rel, rotate, say, summon, Variable, tellraw, tp } from "sandstone";
import { SpellLibrary, Spell, SchoolID } from "../../spellbook/SpellLibrary";
import * as player from '../../player_handler'
import * as Burning from '../../StatusEffects/Burning'
import { Lifetime, Caster } from '../Common'

const SCHOOLID: SchoolID = "fire";
const SPELLID: string = "heatwave";
const spell: Spell = SpellLibrary[SCHOOLID].spells[SPELLID];

const spellPath = `spells/${SCHOOLID}/${SPELLID}`;

const Projectile = Label(`spell.${SCHOOLID}.${SPELLID}.bolt`);

const spawnBolt = MCFunction(`${spellPath}/spawn_bolt`, () => {
    execute.anchored('eyes').rotated.as('@s').run(() => {
        Caster('@s').add();

        let count = 20;
        for (let i = 0; i < count; i++) {
            const angle = ((i / count) * (Math.PI * 2)) * (180 / Math.PI);

            execute.summon('minecraft:marker').run(() => {
                Projectile('@s').add();
                Lifetime('@s').set(75);
                data.modify(Data('entity', '@s').select('data.owner')).set.from(Data('entity', Selector('@n', {
                    tag: Caster
                })).select('UUID'));

                rotate('@s', abs(angle, 0))
            })
        }

        Caster('@s').remove();
    })

})

MCFunction(`${spellPath}/update_bolts`, () => {
    const BoltSelector = Selector('@e', {
        type: 'minecraft:marker',
        tag: Projectile
    });

    execute.as(BoltSelector).at('@s').run(() => {
        Lifetime('@s').remove(1);
        
        particle('flame', rel(0, 0, 0), abs(0.05, 0, 0.05), 0.01, 2, 'force');
        rotate('@s', rel(5, 0));
        tp('@s', loc(0, 0, 0.2));

        const toHit = Selector('@e', {
            distance: [0, 1],
            type: '!marker'
        })

        execute.as(toHit).if.entity('@s').run(() => {
            damage('@s', 1, 'on_fire');
            Burning.apply(Variable(2));
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
                damage('@s', 3, 'on_fire')
            })
        })

        _.if(Lifetime('@s').lessOrEqualThan(0), () => {
            kill('@s');
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