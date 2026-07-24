tp @s ^ ^ ^0.4
particle electric_spark ~ ~ ~ 0.05 0.05 0.05 0.1 2 force @a[distance=0..24, distance=0,24]
execute if entity @e[type=#sandstone_summit_booth:targetable, tag=!sandstone_summit_booth.status.charged, tag=!sandstone_summit_booth.status.charged, distance=0..0.6, distance=0,0.6] run function sandstone_summit_booth:sections/magic/status/charged/arc/raycast_step/execute_if
execute unless block ~ ~ ~ #minecraft:replaceable run function sandstone_summit_booth:sections/magic/status/charged/arc/raycast_step/execute_unless