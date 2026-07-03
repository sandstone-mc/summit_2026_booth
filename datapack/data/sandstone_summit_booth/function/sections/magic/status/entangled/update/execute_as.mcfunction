particle minecraft:tinted_leaves{color:[0,1,0,1]} ~ ~1 ~ 0.1 0.25 0.1 0.01 1 force
execute if score @s sandstone_summit_booth.status.entangled_timer matches ..0 run function sandstone_summit_booth:sections/magic/status/entangled/end
scoreboard players operation anon_WnYlBycD_8 __sandstone = @s sandstone_summit_booth.status.entangled_timer
scoreboard players operation anon_WnYlBycD_8 __sandstone %= 15 __sandstone
execute if score anon_WnYlBycD_8 __sandstone matches 0 run damage @s 1 cactus
scoreboard players remove @s sandstone_summit_booth.status.entangled_timer 1