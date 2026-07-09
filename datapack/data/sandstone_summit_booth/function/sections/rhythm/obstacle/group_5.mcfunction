execute store result score anon_WnYlBycD_6 __sandstone run random value 0..6 sandstone_summit_booth:wall_pick
execute if score anon_WnYlBycD_6 __sandstone matches 0 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g4_m0
execute if score anon_WnYlBycD_6 __sandstone matches 1 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g4_m1
execute if score anon_WnYlBycD_6 __sandstone matches 2 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g4_m2
execute if score anon_WnYlBycD_6 __sandstone matches 3 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g4_m3
execute if score anon_WnYlBycD_6 __sandstone matches 4 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g4_m4
execute if score anon_WnYlBycD_6 __sandstone matches 5 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g4_m5
execute if score anon_WnYlBycD_6 __sandstone matches 6 run function sandstone_summit_booth:sections/rhythm/obstacle/g4_m6