scoreboard players set anon_WnYlBycD_17 __sandstone 0
execute as @a[tag=snd.rhythm.wall.cd] run function sandstone_summit_booth:sections/rhythm/collision/tick/if/execute_as
execute as @a[tag=snd.rhythm.player] at @s run function sandstone_summit_booth:sections/rhythm/collision/tick/if/execute_as2
execute as @a[tag=snd.rhythm.player, tag=!snd.rhythm.wall.cd] at @s unless predicate sandstone_summit_booth:is_sneaking positioned ~ ~1 ~ if entity @e[tag=snd.rhythm.wall.hit, tag=!snd.rhythm.parkour, distance=0..0.7] run function sandstone_summit_booth:sections/rhythm/collision/hit