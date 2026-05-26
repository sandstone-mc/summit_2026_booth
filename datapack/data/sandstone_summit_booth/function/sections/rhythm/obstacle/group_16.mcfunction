execute store result score $pick sandstone_summit_booth.ssb_wpk run random value 0..7 sandstone_summit_booth:wall_pick
execute if score $pick sandstone_summit_booth.ssb_wpk matches 0 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g15_m0
execute if score $pick sandstone_summit_booth.ssb_wpk matches 1 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g15_m1
execute if score $pick sandstone_summit_booth.ssb_wpk matches 2 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g15_m2
execute if score $pick sandstone_summit_booth.ssb_wpk matches 3 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g15_m3
execute if score $pick sandstone_summit_booth.ssb_wpk matches 4 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g15_m4
execute if score $pick sandstone_summit_booth.ssb_wpk matches 5 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g15_m5
execute if score $pick sandstone_summit_booth.ssb_wpk matches 6 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g15_m6
execute if score $pick sandstone_summit_booth.ssb_wpk matches 7 run function sandstone_summit_booth:sections/rhythm/obstacle/g15_m7