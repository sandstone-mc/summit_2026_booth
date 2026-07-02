tag @s add sandstone_summit_booth.spells.arcane.magic_missile.target.ray_active
execute as @e[tag=sandstone_summit_booth.spells.arcane.magic_missile.target.ray_caster,limit=1] at @s anchored eyes rotated as @s run rotate @n[tag=sandstone_summit_booth.spells.arcane.magic_missile.target.ray_active] ~ ~
tp @s ~ ~1.62 ~
function sandstone_summit_booth:sections/magic/spells/arcane/magic_missile/target/raycast
kill @s