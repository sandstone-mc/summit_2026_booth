execute store result score $pick sandstone_summit_booth.ssb_wpk run random value 0..2 sandstone_summit_booth:wall_pick
execute if score $pick sandstone_summit_booth.ssb_wpk matches 0 run return run function sandstone_summit_booth:sections/rythm/obstacle/g6_m0
execute if score $pick sandstone_summit_booth.ssb_wpk matches 1 run return run function sandstone_summit_booth:sections/rythm/obstacle/g6_m1
execute if score $pick sandstone_summit_booth.ssb_wpk matches 2 run function sandstone_summit_booth:sections/rythm/obstacle/g6_m2