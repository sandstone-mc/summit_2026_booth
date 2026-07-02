particle dust_color_transition{from_color:[0.63,0.1,.74],to_color:[0.29,0.29,0.29],scale:1} ~ ~ ~ 0.05 0.05 0.05 0.01 3 force
execute if entity @e[tag=sandstone_summit_booth.spell.arcane.magic_missile.target, type=#sandstone_summit_booth:targetable, limit=1, sort=nearest] run function sandstone_summit_booth:sections/magic/spells/arcane/magic_missile/update/execute_as/execute_if
execute unless entity @e[tag=sandstone_summit_booth.spell.arcane.magic_missile.target, type=#sandstone_summit_booth:targetable, limit=1, sort=nearest] run tp @s ^ ^ ^0.4
scoreboard players remove @s sandstone_summit_booth.lifetime 1
execute if score @s sandstone_summit_booth.lifetime matches ..0 run function sandstone_summit_booth:sections/magic/spells/arcane/magic_missile/update/execute_as/if
execute positioned ~-0.1 ~-0.05 ~-0.1 run function sandstone_summit_booth:sections/magic/spells/arcane/magic_missile/update/execute_as/execute_positioned
execute unless block ~ ~ ~ #minecraft:replaceable run function sandstone_summit_booth:sections/magic/spells/arcane/magic_missile/update/execute_as/execute_unless2