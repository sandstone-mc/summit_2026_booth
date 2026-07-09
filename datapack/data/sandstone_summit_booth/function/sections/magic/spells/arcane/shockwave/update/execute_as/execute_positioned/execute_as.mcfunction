rotate @s facing entity @p feet
rotate @s ~ -60
execute rotated as @s run function sandstone_summit_booth:sections/magic/spells/arcane/shockwave/update/execute_as/execute_positioned/execute_as/execute_rotated
damage @s 1 magic
execute as @e[tag=sandstone_summit_booth.spell.arcane.shockwave.projectile, distance=0..2] run kill @s