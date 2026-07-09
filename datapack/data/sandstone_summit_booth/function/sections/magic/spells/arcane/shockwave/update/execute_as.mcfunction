particle dust_color_transition{from_color:[0.63,0.1,.74],to_color:[0.29,0.29,0.29],scale:1} ~ ~0.5 ~ 0.05 0.05 0.05 0.01 1 force
rotate @s ~2 ~
tp @s ^ ^ ^0.5
scoreboard players remove @s sandstone_summit_booth.lifetime 1
execute if score @s sandstone_summit_booth.lifetime matches ..0 run kill @s
execute positioned ~-1.5 ~-1 ~-1.5 run function sandstone_summit_booth:sections/magic/spells/arcane/shockwave/update/execute_as/execute_positioned
execute unless block ~ ~ ~ #minecraft:replaceable run kill @s