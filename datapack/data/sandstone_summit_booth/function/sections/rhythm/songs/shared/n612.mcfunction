execute as @a[x=-94, y=51, z=10, dx=48, dy=24, dz=64] run tag @s add sandstone_summit_booth.rhythm.showcase.listener
execute as @a[tag=sandstone_summit_booth.rhythm.showcase.listener] at @s run playsound block.note_block.flute master @s ~ ~ ~ 1 1.4142135623730951
execute as @a[tag=sandstone_summit_booth.rhythm.showcase.listener] at @s run playsound block.note_block.hat master @s ~ ~ ~ 1 1
execute as @a[tag=sandstone_summit_booth.rhythm.showcase.listener] at @s run playsound block.note_block.pling master @s ~ ~ ~ 1 0.8908987181403393
execute as @a[tag=sandstone_summit_booth.rhythm.showcase.listener] run tag @s remove sandstone_summit_booth.rhythm.showcase.listener