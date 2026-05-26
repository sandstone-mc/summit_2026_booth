import { advancement, Advancement, Enchantment, execute, LootTable, MCFunction, NBTInt, Objective, say, Selector, _, Model } from "sandstone";

const ITEM_ID = 'fire_gem';

Model("item", ITEM_ID, {
    parent: "minecraft:item/generated",
    textures: {
        layer9: "arcane_arts:item/fire_gem"
    }
});

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
          "name": "minecraft:poisonous_potato"
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
                  "text": "Fire Attunement Gem",
                },
                "minecraft:rarity": "epic",
                "minecraft:custom_data": {
                  "arcane_arts.id": ITEM_ID,
                  "arcane_arts.item_type": "gem"
                },
                "minecraft:consumable": {
                  "consume_seconds": 1000000,
                  "animation": "spear",
                  "has_consume_particles": false,
                  "on_consume_effects": []
                },
                "minecraft:use_cooldown": {
                  "seconds": 10,
                  "cooldown_group": "arcane_arts:gem_use"
                },
                "minecraft:unbreakable": {},
                "minecraft:use_effects": {
                    "speed_multiplier": 1,
                    "can_sprint": true
                },
                'minecraft:item_model': 'arcane_arts:item/fire_gem',
              },
              "conditions": []
            }
          ]
        }
      ]
    }
  ]
})