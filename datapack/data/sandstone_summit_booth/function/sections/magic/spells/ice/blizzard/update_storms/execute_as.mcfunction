particle snowflake ~ ~3 ~ 3 3 3 0 40 force @a[distance=0..24]
scoreboard players remove @s sandstone_summit_booth.lifetime 5
execute if score @s sandstone_summit_booth.lifetime matches ..0 run kill @s
execute as @e[distance=0..6, type=#sandstone_summit_booth:targetable] run function sandstone_summit_booth:sections/magic/spells/ice/blizzard/update_storms/execute_as/execute_as