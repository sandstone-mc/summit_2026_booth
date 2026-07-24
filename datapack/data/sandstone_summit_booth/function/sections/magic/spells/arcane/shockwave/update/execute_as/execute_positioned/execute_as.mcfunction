rotate @s facing entity @a[tag=sandstone_summit_booth.showcase.player,limit=1] feet
rotate @s ~ -60
execute rotated as @s run function sandstone_summit_booth:sections/magic/spells/arcane/shockwave/update/execute_as/execute_positioned/execute_as/execute_rotated
damage @s 1 magic
execute as @e[distance=0..2, tag=sandstone_summit_booth.spell.arcane.shockwave.projectile] run kill @s