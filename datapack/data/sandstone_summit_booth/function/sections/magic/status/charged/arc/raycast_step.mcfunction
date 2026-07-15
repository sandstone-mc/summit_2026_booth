tp @s ^ ^ ^0.4
particle electric_spark ~ ~ ~ 0.05 0.05 0.05 0.1 2 force @a[distance=0..24]
execute if entity @e[tag=!sandstone_summit_booth.status.charged, distance=0..0.6, type=#sandstone_summit_booth:targetable] run function sandstone_summit_booth:sections/magic/status/charged/arc/raycast_step/execute_if
execute unless block ~ ~ ~ #minecraft:replaceable run function sandstone_summit_booth:sections/magic/status/charged/arc/raycast_step/execute_unless