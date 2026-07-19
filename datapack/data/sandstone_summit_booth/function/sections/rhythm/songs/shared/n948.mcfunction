execute as @a[x=-94, y=51, z=10, dx=48, dy=24, dz=64] run tag @s add sandstone_summit_booth.rhythm.showcase.listener
execute as @a[tag=sandstone_summit_booth.rhythm.showcase.listener] at @s run playsound block.note_block.flute master @s ~ ~ ~ 1 1.3348398541700344
execute as @a[tag=sandstone_summit_booth.rhythm.showcase.listener] run tag @s remove sandstone_summit_booth.rhythm.showcase.listener