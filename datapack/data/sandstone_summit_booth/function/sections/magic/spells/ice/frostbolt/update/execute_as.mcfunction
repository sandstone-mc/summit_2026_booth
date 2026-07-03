particle snowflake ~ ~ ~ 0.1 0.1 0.1 0.01 5 force
tp @s ^ ^ ^1.2
scoreboard players remove @s sandstone_summit_booth.lifetime 1
execute if score @s sandstone_summit_booth.lifetime matches ..0 run kill @s
execute positioned ~-0.1 ~-0.05 ~-0.1 run function sandstone_summit_booth:sections/magic/spells/ice/frostbolt/update/execute_as/execute_positioned
execute unless block ~ ~ ~ #minecraft:replaceable run kill @s