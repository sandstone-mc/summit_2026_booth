tag @s add sandstone_summit_booth.spells.arcane.blink.ray_active
execute as @e[tag=sandstone_summit_booth.spells.arcane.blink.ray_caster,limit=1] at @s anchored eyes rotated as @s run rotate @n[tag=sandstone_summit_booth.spells.arcane.blink.ray_active] ~ ~
tp @s ~ ~1.62 ~
function sandstone_summit_booth:sections/magic/spells/arcane/blink/raycast
execute at @s as @e[tag=sandstone_summit_booth.spells.arcane.blink.ray_caster, distance=0..17] run function sandstone_summit_booth:sections/magic/spells/arcane/blink/fire_raycast/execute_anchored/execute_summon/execute_at
kill @s