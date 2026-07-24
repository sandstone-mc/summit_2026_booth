particle spore_blossom_air ~ ~ ~ 0.1 0.1 0.1 0 1 force @a[distance=0..24]
particle minecraft:tinted_leaves{color:[0,1,0,1]} ~ ~ ~ 0.05 0.05 0.05 0 1 force @a[distance=0..24]
tp @s ^ ^ ^0.5
scoreboard players remove @s sandstone_summit_booth.lifetime 1
execute if score @s sandstone_summit_booth.lifetime matches ..0 run kill @s
execute positioned ~-1.5 ~-1 ~-1.5 run function sandstone_summit_booth:sections/magic/spells/nature/entangle/update/execute_as/execute_positioned