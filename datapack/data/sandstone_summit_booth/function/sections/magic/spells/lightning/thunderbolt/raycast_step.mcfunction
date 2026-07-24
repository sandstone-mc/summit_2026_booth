tp @s ^ ^ ^0.5
particle electric_spark ~ ~ ~ 0.02 0.02 0.02 0.01 1 force @a[distance=0..24]
execute unless block ~ ~ ~ #minecraft:replaceable run function sandstone_summit_booth:sections/magic/spells/lightning/thunderbolt/raycast_step/execute_unless