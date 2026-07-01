import { advancement, Advancement, Enchantment, execute, LootTable, MCFunction, NBTInt, Objective, say, Selector, _, functionCmd, raw, dialog, DialogClass, Dialog, data, Data } from 'sandstone'
import { SpellLibrary } from '../../spellbook/SpellLibrary'
import { getSelf, saveSelf, io } from '../../PlayerDB'

const WAND_PREDICATE = {
    predicates: {
        'minecraft:custom_data': { 'arcane_arts.item_type': 'wand' }
    }
}

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
                    function: 'arcane_arts:input/on_wand_left_click'
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
      command: `trigger arcane_arts.set_spell_trigger set ${spellValue.uid}`
    }
  }))

  dialogTemplate.title.text = `${school.name} Spells`

  // Register Dialog keyed by school
  Dialog(`spell_select_${schoolKey}`, { ...dialogTemplate, actions })
}

const _openSchoolDialog = MCFunction('input/_open_school_dialog', () => {
  raw('$dialog show @s arcane_arts:spell_select_$(school)')
}, { lazy: true })

MCFunction('input/on_wand_left_click', () => {
    getSelf()
    data.modify(Data('storage', 'arcane_arts:macro').select('school')).set.from(io.select('current_school'))

    functionCmd(_openSchoolDialog, 'with', 'storage', 'arcane_arts:macro')
})

// Right click detect
const wandCooldown = Objective.create('wand_cooldown')

const cooldownAdvancement = Advancement('input/wand_use_cooldown', {
	'criteria': { 'tick': {
		'trigger': 'minecraft:tick'
	}},
	'rewards': { 'function': 'arcane_arts:input/wand_use_cooldown' }
})

const useWandAdvancement = Advancement('input/wand_use', {
	'criteria': { 'use_item': {
		'trigger': 'minecraft:using_item',
		'conditions': { 'item': { 
            WAND_PREDICATE
        }}
	}},
	'rewards': { 'function': 'arcane_arts:input/wand_use' }
})

MCFunction('input/wand_use_cooldown', () => {
    wandCooldown('@s').remove(1)
    _.if(wandCooldown('@s').greaterOrEqualThan(1), () => {
        cooldownAdvancement.revoke('@s')
    }).else(() => {
        wandCooldown('@s').reset()
    })
})

MCFunction('input/wand_use', () => {
    _.if(_.not(wandCooldown('@s').greaterOrEqualThan(1)), () => {
        // Trigger effects
        getSelf()

        functionCmd(MCFunction('cast_macro', () => {
            raw(`$function arcane_arts:spells/$(current_school)/$(selected_spell)/cast`)
        }), 'with', 'storage', 'arcane_arts:io', 'data')
    })

    useWandAdvancement.revoke('@s')
    cooldownAdvancement.revoke('@s')
    wandCooldown('@s').set(2)
})