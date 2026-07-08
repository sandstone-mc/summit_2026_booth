function sandstone_summit_booth:sections/magic/status/charged/arc_to_target
execute as @e[tag=!sandstone_summit_booth.status.charged, distance=0..8, type=#sandstone_summit_booth:targetable, limit=1, sort=nearest] run function sandstone_summit_booth:sections/magic/status/charged/update/execute_as/if/execute_if/execute_as
damage @s 1 lightning_bolt