tag @s add sandstone_summit_booth.spells.nature.vine_whip.ray_active
execute as @e[tag=sandstone_summit_booth.spells.nature.vine_whip.ray_caster, limit=1] at @s anchored eyes rotated as @s run rotate @n[tag=sandstone_summit_booth.spells.nature.vine_whip.ray_active] ~ ~
tp @s ~ ~1.62 ~
function sandstone_summit_booth:sections/magic/spells/nature/vine_whip/raycast
kill @s