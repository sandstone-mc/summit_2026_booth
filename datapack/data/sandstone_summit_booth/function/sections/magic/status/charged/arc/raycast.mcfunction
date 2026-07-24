scoreboard players set loop_iterator_0_WnYlBycD __sandstone 0
execute if score loop_iterator_0_WnYlBycD __sandstone matches ..20 run function sandstone_summit_booth:sections/magic/status/charged/arc/raycast/loop
execute if entity @s[tag=sandstone_summit_booth.status.charged.arc.ray_active] run tag @s remove sandstone_summit_booth.status.charged.arc.ray_active