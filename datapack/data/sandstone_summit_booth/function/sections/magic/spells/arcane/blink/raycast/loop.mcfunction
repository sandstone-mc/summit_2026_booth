execute if entity @s[tag=sandstone_summit_booth.spells.arcane.blink.ray_active] run function sandstone_summit_booth:sections/magic/spells/arcane/blink/raycast/loop/if
scoreboard players add loop_iterator_1_WnYlBycD __sandstone 1
execute if score loop_iterator_1_WnYlBycD __sandstone matches ..15 run function sandstone_summit_booth:sections/magic/spells/arcane/blink/raycast/loop