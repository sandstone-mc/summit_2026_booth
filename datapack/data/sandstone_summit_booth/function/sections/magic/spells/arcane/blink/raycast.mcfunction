scoreboard players set loop_iterator_1_WnYlBycD __sandstone 0
execute if score loop_iterator_1_WnYlBycD __sandstone matches ..15 run function sandstone_summit_booth:sections/magic/spells/arcane/blink/raycast/loop
execute if entity @s[tag=sandstone_summit_booth.spells.arcane.blink.ray_active] run tag @s remove sandstone_summit_booth.spells.arcane.blink.ray_active