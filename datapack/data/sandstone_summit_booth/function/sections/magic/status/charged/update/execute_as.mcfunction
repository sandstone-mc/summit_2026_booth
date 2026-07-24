particle electric_spark ~ ~1 ~ 0.3 0.5 0.3 0.05 3 force @a[distance=0..24]
execute store result score @s sandstone_summit_booth.status.charged_roll run random value 1..50
execute if score @s sandstone_summit_booth.status.charged_roll matches 1 run function sandstone_summit_booth:sections/magic/status/charged/update/execute_as/if
execute if score @s sandstone_summit_booth.status.charged_timer matches ..0 run function sandstone_summit_booth:sections/magic/status/charged/end
scoreboard players operation anon_WnYlBycD_69 __sandstone = @s sandstone_summit_booth.status.charged_timer
scoreboard players operation anon_WnYlBycD_69 __sandstone %= 30 __sandstone
execute if score anon_WnYlBycD_69 __sandstone matches 0 run damage @s 1 lightning_bolt
scoreboard players remove @s sandstone_summit_booth.status.charged_timer 1