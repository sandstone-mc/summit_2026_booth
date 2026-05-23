import { Label, MCFunction, Objective, Selector, Tag, _, abs, damage, data, Data, execute, kill, loc, particle, rel, rotate, say, summon, Variable, tellraw, tp, functionCmd, sleep } from "sandstone";
import { SpellLibrary, Spell, SchoolID } from "../../spellbook/SpellLibrary";
import * as player from '../../player_handler'
import * as Burning from '../../StatusEffects/Burning'
import { Lifetime, Caster } from '../Common'


const SCHOOLID: SchoolID = "fire";
const SPELLID: string = "launch";
const spell: Spell = SpellLibrary[SCHOOLID].spells[SPELLID];

const spellPath = `spells/${SCHOOLID}/${SPELLID}`;

const launching = Label(`spell.${SCHOOLID}.${SPELLID}.launching`);

MCFunction(`${spellPath}/cast`, () => {
    _.if(player.mana('@s').greaterOrEqualThan(spell.mana_cost), () => {
        player.mana('@s').remove(spell.mana_cost);

        // /execute rotated 0 -90 run function pl_impulse:execute {func:"motion",in:{velocity:1.3}}
        execute.rotated([0, -90]).run(() => {
            functionCmd("pl_impulse:execute", { func:"motion", in: { velocity:1.3 } })
        })

        launching('@s').add();

        sleep('1s');

        launching('@s').remove();
    }).else(() => {
        tellraw('@s', {
            color: "red",
            text: "Insufficient Mana"
        })
    })
}, {
    asyncContext: true
})

MCFunction(`${spellPath}/particles`, () => {
    execute.as(Selector('@e', {
        tag: Caster
    })).at('@s').run(() => {
        particle('dust_color_transition{from_color:[0.93,0.64,0.06],to_color:[0.29,0.29,0.29],scale:1}', rel(0, 0, 0), abs(0.2, 0.2, 0.2), 0.4, 5)
    })
}, {
    runEveryTick: true
})