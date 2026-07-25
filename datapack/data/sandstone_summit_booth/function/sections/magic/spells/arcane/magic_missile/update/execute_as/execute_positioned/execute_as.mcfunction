damage @s 4 magic
particle reverse_portal ~ ~ ~ 0.05 0.05 0.05 0.2 30 force @a[distance=0..24]
tag @s remove sandstone_summit_booth.spell.arcane.magic_missile.target
execute as @e[type=minecraft:marker, distance=0..2, tag=sandstone_summit_booth.spell.arcane.magic_missile.projectile] run function sandstone_summit_booth:sections/magic/spells/arcane/magic_missile/update/execute_as/execute_positioned/execute_as/execute_as