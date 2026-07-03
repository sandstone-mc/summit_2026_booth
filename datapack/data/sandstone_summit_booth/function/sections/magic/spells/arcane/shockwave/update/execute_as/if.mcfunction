particle dust_color_transition{from_color:[0.63,0.1,.74],to_color:[0.29,0.29,0.29],scale:1} ~ ~0.5 ~ 0.05 0.05 0.05 0.01 1 force
rotate @s ~2 ~
tp @s ^ ^ ^0.5
execute as @e[distance=0..1.5, type=#sandstone_summit_booth:targetable] run function sandstone_summit_booth:sections/magic/spells/arcane/shockwave/update/execute_as/if/execute_as
execute if score @s sandstone_summit_booth.lifetime matches ..-21 run kill @s