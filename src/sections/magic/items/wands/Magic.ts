import { LootTable } from "sandstone";

export const MAGIC_WAND_ID = 'magic_wand';

LootTable('items/' + MAGIC_WAND_ID, {
  "type": "minecraft:entity",
  "pools": [
    {
      "rolls": { "type": "minecraft:constant", "value": 1 },
      "entries": [{ "type": "minecraft:item", "name": "minecraft:stick" }],
      "functions": [
        {
          "function": "minecraft:sequence",
          "functions": [
            {
              "function": "minecraft:set_components",
              "components": {
                "minecraft:item_name": { "text": "Magic Wand", "color": "light_purple", "italic": false, "bold": true },
                "minecraft:rarity": "epic",
                "minecraft:custom_data": {
                  "arcane_arts.id": MAGIC_WAND_ID,
                  "arcane_arts.item_type": "wand"
                },
                "minecraft:weapon": { "item_damage_per_attack": 0, "disable_blocking_for_seconds": 0 },
                "minecraft:consumable": {
                  "consume_seconds": 1000000,
                  "animation": "spear",
                  "has_consume_particles": false,
                  "on_consume_effects": []
                },
                "minecraft:use_cooldown": { "seconds": 0.5, "cooldown_group": "arcane_arts:wand_use" },
                "minecraft:enchantments": { "arcane_arts:input/wand_left_click": 1 },
                "minecraft:unbreakable": {},
                "minecraft:attribute_modifiers": [
                  {
                    "type": "minecraft:attack_damage",
                    "id": "wand",
                    "amount": -1,
                    "operation": "add_multiplied_total",
                    "display": { "type": "hidden" }
                  }
                ],
                "minecraft:tooltip_display": { "hidden_components": ["minecraft:enchantments"] },
                "minecraft:use_effects": { "speed_multiplier": 1, "can_sprint": true },
                "minecraft:piercing_weapon": { "deals_knockback": false, "dismounts": false }
              },
              "conditions": []
            }
          ]
        }
      ]
    }
  ]
})
