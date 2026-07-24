tp @s ^ ^ ^0.5
particle spore_blossom_air ~ ~ ~ 0.05 0.05 0.05 0.01 1 force @a[distance=0..24]
particle minecraft:tinted_leaves{color:[0,1,0,1]} ~ ~ ~ 0.05 0.05 0.05 0.01 1 force @a[distance=0..24]
execute positioned ~-1.5 ~-1.5 ~-1.5 run function sandstone_summit_booth:sections/magic/spells/nature/vine_whip/raycast_step/execute_positioned
execute unless block ~ ~ ~ #minecraft:replaceable run function sandstone_summit_booth:sections/magic/spells/nature/vine_whip/raycast_step/execute_unless