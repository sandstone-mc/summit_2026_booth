particle crit ~ ~ ~ 0.05 0.05 0.05 0.01 1 force
particle spore_blossom_air ~ ~ ~ 0.05 0.05 0.05 0 1 force
tp @s ^ ^ ^0.6
scoreboard players remove @s sandstone_summit_booth.lifetime 1
execute if score @s sandstone_summit_booth.lifetime matches ..0 run function sandstone_summit_booth:sections/magic/spells/nature/thorn_volley/update/execute_as/if
execute positioned ~-0.1 ~-0.05 ~-0.1 run function sandstone_summit_booth:sections/magic/spells/nature/thorn_volley/update/execute_as/execute_positioned
execute unless block ~ ~ ~ #minecraft:replaceable run function sandstone_summit_booth:sections/magic/spells/nature/thorn_volley/update/execute_as/execute_unless