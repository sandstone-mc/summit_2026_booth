particle flame ~ ~1 ~ 0.1 0.25 0.1 0.01 5 force
execute if score @s sandstone_summit_booth.status.burning_timer matches ..0 run function sandstone_summit_booth:sections/magic/status/burning/end
scoreboard players operation anon_WnYlBycD_55 __sandstone = @s sandstone_summit_booth.status.burning_timer
scoreboard players operation anon_WnYlBycD_55 __sandstone %= 20 __sandstone
execute if score anon_WnYlBycD_55 __sandstone matches 0 run damage @s 1 on_fire
scoreboard players remove @s sandstone_summit_booth.status.burning_timer 1