execute store result score $pick sandstone_summit_booth.ssb_wpk run random value 0..5 sandstone_summit_booth:wall_pick
execute if score $pick sandstone_summit_booth.ssb_wpk matches 0 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g9_m0
execute if score $pick sandstone_summit_booth.ssb_wpk matches 1 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g9_m1
execute if score $pick sandstone_summit_booth.ssb_wpk matches 2 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g9_m2
execute if score $pick sandstone_summit_booth.ssb_wpk matches 3 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g9_m3
execute if score $pick sandstone_summit_booth.ssb_wpk matches 4 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g9_m4
execute if score $pick sandstone_summit_booth.ssb_wpk matches 5 run function sandstone_summit_booth:sections/rhythm/obstacle/g9_m5