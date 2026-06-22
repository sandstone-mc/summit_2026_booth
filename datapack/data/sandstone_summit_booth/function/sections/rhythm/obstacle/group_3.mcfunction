execute store result score $pick sandstone_summit_booth.rhythm.wall_variable run random value 0..3 sandstone_summit_booth:wall_pick
execute if score $pick sandstone_summit_booth.rhythm.wall_variable matches 0 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g2_m0
execute if score $pick sandstone_summit_booth.rhythm.wall_variable matches 1 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g2_m1
execute if score $pick sandstone_summit_booth.rhythm.wall_variable matches 2 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g2_m2
execute if score $pick sandstone_summit_booth.rhythm.wall_variable matches 3 run function sandstone_summit_booth:sections/rhythm/obstacle/g2_m3