import { advancement, Advancement, Enchantment, execute, LootTable, MCFunction, NBTInt, Objective, say, Selector, _ } from "sandstone";

const ITEM_ID = 'ice_wand';

LootTable('items/' + ITEM_ID, {
  "type": "minecraft:entity",
  "pools": [
    {
      "rolls": {
        "type": "minecraft:constant",
        "value": 1
      },
      "entries": [
        {
          "type": "minecraft:item",
          "name": "minecraft:breeze_rod"
        }
      ],
      "functions": [
        {
          "function": "minecraft:sequence",
          "functions": [
            {
              "function": "minecraft:set_components",
              "components": {
                "minecraft:item_name": {
                  "text": "Ice Wand",
                  "color": "aqua",
                  "italic": false,
                  "bold": true
                },
                "minecraft:rarity": "epic",
                "minecraft:custom_data": {
                  "arcane_arts.id": ITEM_ID,
                  "arcane_arts.item_type": "wand"
                },
                "minecraft:weapon": {
                  "item_damage_per_attack": 0,
                  "disable_blocking_for_seconds": 0
                },
                "minecraft:consumable": {
                  "consume_seconds": 1000000,
                  "animation": "spear",
                  "has_consume_particles": false,
                  "on_consume_effects": []
                },
                "minecraft:use_cooldown": {
                  "seconds": 0.5,
                  "cooldown_group": "arcane_arts:wand_use"
                },
                "minecraft:enchantments": {
                    "arcane_arts:input/wand_left_click": 1
                },
                "minecraft:unbreakable": {},
                "minecraft:attribute_modifiers": [
                  {
                    "type": "minecraft:attack_damage",
                    "id": "wand",
                    "amount": -1,
                    "operation": "add_multiplied_total",
                    "display": {
                      "type": "hidden"
                    }
                  }
                ],
                "minecraft:tooltip_display": {
                    "hidden_components": [ "minecraft:enchantments" ]
                },
                "minecraft:use_effects": {
                    "speed_multiplier": 1,
                    "can_sprint": true
                },
                "minecraft:piercing_weapon": {
                  "deals_knockback": false,
                  "dismounts": false
                }
              },
              "conditions": []
            }
          ]
        }
      ]
    }
  ]
})