scoreboard players set anon_WnYlBycD_32 __sandstone 0
execute as @a[tag=ssb.rhythm.wall.cd] run function sandstone_summit_booth:sections/rhythm/collision/tick/if/execute_as
execute as @a[tag=ssb.rhythm.player] at @s run function sandstone_summit_booth:sections/rhythm/collision/tick/if/execute_as2
execute as @a[tag=ssb.rhythm.player, tag=!ssb.rhythm.wall.cd] at @s unless predicate sandstone_summit_booth:is_sneaking positioned ~ ~1 ~ if entity @e[tag=ssb.rhythm.wall.hit, tag=!ssb.rhythm.parkour, distance=0..0.7] run function sandstone_summit_booth:sections/rhythm/collision/hit