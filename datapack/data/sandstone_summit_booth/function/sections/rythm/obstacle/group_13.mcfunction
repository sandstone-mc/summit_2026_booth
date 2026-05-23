execute store result score $pick sandstone_summit_booth.ssb_wpk run random value 0..4 sandstone_summit_booth:wall_pick
execute if score $pick sandstone_summit_booth.ssb_wpk matches 0 run return run function sandstone_summit_booth:sections/rythm/obstacle/g12_m0
execute if score $pick sandstone_summit_booth.ssb_wpk matches 1 run return run function sandstone_summit_booth:sections/rythm/obstacle/g12_m1
execute if score $pick sandstone_summit_booth.ssb_wpk matches 2 run return run function sandstone_summit_booth:sections/rythm/obstacle/g12_m2
execute if score $pick sandstone_summit_booth.ssb_wpk matches 3 run return run function sandstone_summit_booth:sections/rythm/obstacle/g12_m3
execute if score $pick sandstone_summit_booth.ssb_wpk matches 4 run function sandstone_summit_booth:sections/rythm/obstacle/g12_m4