rotate @s facing entity @p feet
rotate @s ~ -60
execute rotated as @s run function sandstone_summit_booth:sections/magic/spells/arcane/shockwave/update/execute_as/if/execute_as/execute_rotated
damage @s 1 magic