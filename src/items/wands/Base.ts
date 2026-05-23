import { advancement, Advancement, Enchantment, execute, LootTable, MCFunction, NBTInt, Objective, say, Selector, _, functionCmd, raw, dialog, DialogClass, Dialog } from "sandstone";
import { getSelf } from "../../PlayerDB";
import { SpellLibrary } from "../../spellbook/SpellLibrary";

const WAND_PREDICATE = {
    predicates: {
        'minecraft:custom_data': { 'magic.item_type': "wand" }
    }
}

// Left click detect
Enchantment('input/wand_left_click', {
    description: "LeftClickDetect",
    max_level: new NBTInt(1),
    slots: ["hand"],
    supported_items: [],
    weight: new NBTInt(1),
    anvil_cost: new NBTInt(0),
    min_cost: {
        base: new NBTInt(0),
        per_level_above_first: new NBTInt(0)
    },
    max_cost: {
        base: new NBTInt(0),
        per_level_above_first: new NBTInt(0)
    },
    effects: {
        "minecraft:post_piercing_attack": [
            {
                "effect": {
                    type: "run_function",
                    function: "magic:input/on_wand_left_click"
                }
            }
        ]
    }
})

const newLocal = {
    "type": "minecraft:multi_action",
    "title": {
        "text": "$() Spells"
    },
    "body": [],
    "inputs": [],
    "columns": 1,
    "actions": [
        
    ]
};

for (const [ spellKey, spellValue ] of Object.entries(SpellLibrary["fire"].spells)) {
    newLocal.actions.push({
        "label": spellValue.name,
        "action": {
            "type": "minecraft:run_command",
            "command": `trigger magic.set_spell_trigger set ${spellValue.uid}`
        }
    })
}

MCFunction('input/on_wand_left_click', () => {
    say("Left Clicked");
    
    dialog.show('@s', newLocal);
})

// Right click detect
const wandCooldown = Objective.create('wand_cooldown');

const cooldownAdvancement = Advancement('input/wand_use_cooldown', {
	"criteria": { "tick": {
		"trigger": "minecraft:tick"
	}},
	"rewards": { "function": "magic:input/wand_use_cooldown" }
});

const useWandAdvancement = Advancement('input/wand_use', {
	"criteria": { "use_item": {
		"trigger": "minecraft:using_item",
		"conditions": { "item": { 
            WAND_PREDICATE
        }}
	}},
	"rewards": { "function": "magic:input/wand_use" }
})

MCFunction('input/wand_use_cooldown', () => {
    wandCooldown('@s').remove(1);
    _.if(wandCooldown('@s').greaterOrEqualThan(1), () => {
        cooldownAdvancement.revoke('@s');
    }).else(() => {
        wandCooldown('@s').reset();
    });
})

MCFunction('input/wand_use', () => {
    _.if(_.not(wandCooldown('@s').greaterOrEqualThan(1)), () => {
        // Trigger effects
        getSelf();

        functionCmd(MCFunction('cast_macro', () => {
            raw(`$function magic:spells/$(current_school)/$(selected_spell)/cast`);
        }), 'with', 'storage', 'magic:io', 'data');
    });

    useWandAdvancement.revoke('@s');
    cooldownAdvancement.revoke('@s');
    wandCooldown('@s').set(2);
})