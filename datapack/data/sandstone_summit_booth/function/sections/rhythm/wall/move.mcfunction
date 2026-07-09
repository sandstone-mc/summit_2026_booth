execute as @e[tag=ssb.rhythm.wall, tag=ssb.rhythm.wall.hit, tag=!ssb.rhythm.wall.init, tag=!ssb.rhythm.wall.wait] at @s run function sandstone_summit_booth:sections/rhythm/wall/move/execute_as
execute if score anon_WnYlBycD_3 __sandstone matches 1 run function sandstone_summit_booth:sections/rhythm/wall/move/if
execute as @e[tag=ssb.rhythm.wall, type=minecraft:happy_ghast] run rotate @s 0 0