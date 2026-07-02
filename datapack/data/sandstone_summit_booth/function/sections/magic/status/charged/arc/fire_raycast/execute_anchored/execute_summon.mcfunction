tag @s add sandstone_summit_booth.status.charged.arc.ray_active
execute as @e[tag=sandstone_summit_booth.status.charged.arc.ray_caster,limit=1] at @s anchored eyes rotated as @s run rotate @n[tag=sandstone_summit_booth.status.charged.arc.ray_active] ~ ~
tp @s ~ ~1.62 ~
rotate @s facing entity @e[tag=!sandstone_summit_booth.status.charged, distance=0..8, type=#sandstone_summit_booth:targetable, limit=1, sort=nearest] feet
function sandstone_summit_booth:sections/magic/status/charged/arc/raycast
kill @s