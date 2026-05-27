execute store result score $pick sandstone_summit_booth.rhythm.wall_variable run random value 0..9 sandstone_summit_booth:wall_pick
execute if score $pick sandstone_summit_booth.rhythm.wall_variable matches 0 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g8_m0
execute if score $pick sandstone_summit_booth.rhythm.wall_variable matches 1 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g8_m1
execute if score $pick sandstone_summit_booth.rhythm.wall_variable matches 2 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g8_m2
execute if score $pick sandstone_summit_booth.rhythm.wall_variable matches 3 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g8_m3
execute if score $pick sandstone_summit_booth.rhythm.wall_variable matches 4 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g8_m4
execute if score $pick sandstone_summit_booth.rhythm.wall_variable matches 5 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g8_m5
execute if score $pick sandstone_summit_booth.rhythm.wall_variable matches 6 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g8_m6
execute if score $pick sandstone_summit_booth.rhythm.wall_variable matches 7 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g8_m7
execute if score $pick sandstone_summit_booth.rhythm.wall_variable matches 8 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g8_m8
execute if score $pick sandstone_summit_booth.rhythm.wall_variable matches 9 run function sandstone_summit_booth:sections/rhythm/obstacle/g8_m9