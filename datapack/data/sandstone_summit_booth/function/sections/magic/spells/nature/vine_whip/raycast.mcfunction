scoreboard players set loop_iterator_3_WnYlBycD __sandstone 0
execute if score loop_iterator_3_WnYlBycD __sandstone matches ..10 run function sandstone_summit_booth:sections/magic/spells/nature/vine_whip/raycast/loop
execute if entity @s[tag=sandstone_summit_booth.spells.nature.vine_whip.ray_active] run tag @s remove sandstone_summit_booth.spells.nature.vine_whip.ray_active