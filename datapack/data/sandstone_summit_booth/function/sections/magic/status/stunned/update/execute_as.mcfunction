particle crit ~ ~1 ~ 0.1 0.25 0.1 0.01 1 force @a[distance=0..24]
particle electric_spark ~ ~1 ~ 0.3 0.5 0.3 0.05 3 force @a[distance=0..24]
execute if score @s sandstone_summit_booth.status.stunned_timer matches ..0 run function sandstone_summit_booth:sections/magic/status/stunned/end
scoreboard players operation anon_WnYlBycD_60 __sandstone = @s sandstone_summit_booth.status.stunned_timer
scoreboard players operation anon_WnYlBycD_60 __sandstone %= 1000 __sandstone
execute if score anon_WnYlBycD_60 __sandstone matches 0 run damage @s 0 generic
scoreboard players remove @s sandstone_summit_booth.status.stunned_timer 1