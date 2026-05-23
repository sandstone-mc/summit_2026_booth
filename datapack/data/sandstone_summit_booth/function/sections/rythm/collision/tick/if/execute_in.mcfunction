execute as @a[tag=ssb.wall.cd] run function sandstone_summit_booth:sections/rythm/collision/tick/if/execute_in/execute_as
execute as @a[tag=ssb.player, tag=ssb.alive] at @s run function sandstone_summit_booth:sections/rythm/collision/tick/if/execute_in/execute_as2
execute as @a[tag=ssb.alive, tag=ssb.player, tag=!ssb.wall.cd, tag=!ssb.hit_tick] at @s unless predicate sandstone_summit_booth:is_sneaking positioned ~ ~1 ~ if entity @e[tag=ssb.wall.hit, tag=!ssb.parkour, distance=0..0.7] run function sandstone_summit_booth:sections/rythm/collision/hit
tag @a[tag=ssb.hit_tick] remove ssb.hit_tick
execute unless entity @a[tag=ssb.player, tag=ssb.alive] run function sandstone_summit_booth:sections/rythm/end/run