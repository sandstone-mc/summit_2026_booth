execute as @e[tag=ssb.rhythm.wall, distance=0..1.5] run function sandstone_summit_booth:sections/rhythm/collision/break_wall/execute_at/execute_as
playsound minecraft:block.glass.break master @a[x=-82, y=55, z=26, dx=24, dy=16, dz=32] ~ ~ ~ 2 1
particle minecraft:block{block_state:"minecraft:white_stained_glass"} ~ ~0.5 ~ 0.5 0.5 0.5 0.1 20 normal