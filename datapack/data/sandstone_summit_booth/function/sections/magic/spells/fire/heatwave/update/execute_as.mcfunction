particle flame ~ ~ ~ 0.05 0 0.05 0.01 2 force
rotate @s ~5 ~
tp @s ^ ^ ^0.2
scoreboard players remove @s sandstone_summit_booth.lifetime 1
execute if score @s sandstone_summit_booth.lifetime matches ..0 run kill @s
execute positioned ~-0.1 ~-0.05 ~-0.1 run function sandstone_summit_booth:sections/magic/spells/fire/heatwave/update/execute_as/execute_positioned