particle snowflake ~ ~1 ~ 0.1 0.25 0.1 0.01 5 force @a[distance=0..24]
execute if score @s sandstone_summit_booth.status.freezing_timer matches ..0 run function sandstone_summit_booth:sections/magic/status/freezing/end
scoreboard players operation anon_WnYlBycD_56 __sandstone = @s sandstone_summit_booth.status.freezing_timer
scoreboard players operation anon_WnYlBycD_56 __sandstone %= 20 __sandstone
execute if score anon_WnYlBycD_56 __sandstone matches 0 run damage @s 1 freeze
scoreboard players remove @s sandstone_summit_booth.status.freezing_timer 1