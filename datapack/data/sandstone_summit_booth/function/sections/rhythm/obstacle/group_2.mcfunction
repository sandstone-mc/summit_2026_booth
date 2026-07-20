execute store result score anon_WnYlBycD_17 __sandstone run random value 0..5 sandstone_summit_booth:wall_pick
execute if score anon_WnYlBycD_17 __sandstone matches 0 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g1_m0
execute if score anon_WnYlBycD_17 __sandstone matches 1 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g1_m1
execute if score anon_WnYlBycD_17 __sandstone matches 2 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g1_m2
execute if score anon_WnYlBycD_17 __sandstone matches 3 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g1_m3
execute if score anon_WnYlBycD_17 __sandstone matches 4 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g1_m4
execute if score anon_WnYlBycD_17 __sandstone matches 5 run function sandstone_summit_booth:sections/rhythm/obstacle/g1_m5