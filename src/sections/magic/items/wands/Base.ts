import { advancement, Advancement, Enchantment, execute, LootTable, MCFunction, NBTInt, Objective, say, Selector, _, functionCmd, raw, dialog, DialogClass, Dialog, data, Data } from 'sandstone'
import { SpellLibrary } from '../../spellbook/SpellLibrary'
import { getSelf, saveSelf, io } from '../../PlayerDB'

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

const dialogTemplate = {
    'type': 'minecraft:multi_action',
    'title': {
        'text': '$() Spells'
    },
    'body': [],
    'inputs': [],
    'columns': 1,
    'actions': [
        
    ]
}

// Build a dialog per school at compile time
for (const [schoolKey, school] of Object.entries(SpellLibrary)) {
  const actions = Object.values(school.spells).map(spellValue => ({
    label: spellValue.name,
    action: {
      type: 'minecraft:run_command',
      command: `trigger sandstone_summit_booth.set_spell_trigger set ${spellValue.uid}`
    }
  }))

  dialogTemplate.title.text = `${school.name} Spells`

  // Register Dialog keyed by school
  Dialog(`spell_select_${schoolKey}`, { ...dialogTemplate, actions })
}

const _openSchoolDialog = MCFunction('sections/magic/input/_open_school_dialog', () => {
  raw('$dialog show @s sandstone_summit_booth:spell_select_$(school)')
}, { lazy: true })

MCFunction('sections/magic/input/on_wand_left_click', () => {
    getSelf()
    data.modify(Data('storage', 'sandstone_summit_booth:macro').select('school')).set.from(io.select('current_school'))

    functionCmd(_openSchoolDialog, 'with', 'storage', 'sandstone_summit_booth:macro')
})

// Right click detect
const wandCooldown = Objective.create('wand_cooldown')

const cooldownAdvancement = Advancement('input/wand_use_cooldown', {
	'criteria': { 'tick': {
		'trigger': 'minecraft:tick'
	}},
	'rewards': { 'function': 'sandstone_summit_booth:sections/magic/input/wand_use_cooldown' }
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

MCFunction('sections/magic/input/wand_use_cooldown', () => {
    wandCooldown('@s').remove(1)
    _.if(wandCooldown('@s').greaterOrEqualThan(1), () => {
        cooldownAdvancement.revoke('@s')
    }).else(() => {
        wandCooldown('@s').reset()
    })
})

MCFunction('sections/magic/input/wand_use', () => {
    _.if(_.not(wandCooldown('@s').greaterOrEqualThan(1)), () => {
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