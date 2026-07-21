import { Advancement, Enchantment, MCFunction, NBTInt, Objective, _, functionCmd, raw } from 'sandstone'
import { getSelf } from '../../PlayerDB'
import { cycleSpell } from '../../spellbook'
import { spellDisplayTimer, SPELL_DISPLAY_TICKS } from '../../player_handler'

// Left click detect
Enchantment('input/wand_left_click', {
    description: 'LeftClickDetect',
    max_level: new NBTInt(1),
    slots: ['hand'],
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
        'minecraft:post_piercing_attack': [
            {
                'effect': {
                    type: 'run_function',
                    function: 'sandstone_summit_booth:sections/magic/input/on_wand_left_click'
                }
            }
        ]
    }
})

MCFunction('sections/magic/input/on_wand_left_click', () => {
    cycleSpell()
    spellDisplayTimer('@s').set(SPELL_DISPLAY_TICKS)
})

// Right click detect
const wandCooldown = Objective.create('wand_cooldown')

const cooldownAdvancement = Advancement('input/wand_use_cooldown', {
	criteria: { 
        tick: {
		    trigger: 'minecraft:tick'
	    }
    },
	rewards: {
        function: MCFunction('sections/magic/input/wand_use_cooldown', () => {
            wandCooldown('@s').remove(1)
            _.if(wandCooldown('@s').greaterThanOrEqualTo(1), () => {
                cooldownAdvancement.revoke('@s')
            }).else(() => {
                wandCooldown('@s').reset()
            })
        })
    }
})

const useWandAdvancement = Advancement('input/wand_use', {
	'criteria': { 'use_item': {
		'trigger': 'minecraft:using_item',
		'conditions': { 'item': {
            'predicates': {
                'minecraft:custom_data': { 'sandstone_summit_booth.item_type': 'wand' }
            }
        } }
	}},
	'rewards': { 'function': 'sandstone_summit_booth:sections/magic/input/wand_use' }
})

MCFunction('sections/magic/input/wand_use', () => {
    _.if(_.not(wandCooldown('@s').greaterThanOrEqualTo(1)), () => {
        // Trigger effects
        getSelf()

        functionCmd(MCFunction('sections/magic/cast_macro', () => {
            raw(`$function sandstone_summit_booth:sections/magic/spells/$(current_school)/$(selected_spell)/cast`)
        }), 'with', 'storage', 'sandstone_summit_booth:io', 'data')
    })

    useWandAdvancement.revoke('@s')
    cooldownAdvancement.revoke('@s')
    wandCooldown('@s').set(2)
})