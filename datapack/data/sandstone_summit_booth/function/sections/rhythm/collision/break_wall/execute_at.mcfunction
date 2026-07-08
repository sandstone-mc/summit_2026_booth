execute as @e[tag=ssb.rhythm.wall, distance=0..1.5] run function sandstone_summit_booth:sections/rhythm/collision/break_wall/execute_at/execute_as
playsound minecraft:block.glass.break master @a[x=-94, y=51, z=11, dx=48, dy=24, dz=64] ~ ~ ~ 2 1
particle minecraft:block{block_state:"minecraft:white_stained_glass"} ~ ~0.5 ~ 0.5 0.5 0.5 0.1 20 normal