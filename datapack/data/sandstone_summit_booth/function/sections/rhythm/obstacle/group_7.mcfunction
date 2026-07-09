execute store result score anon_WnYlBycD_6 __sandstone run random value 0..2 sandstone_summit_booth:wall_pick
execute if score anon_WnYlBycD_6 __sandstone matches 0 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g6_m0
execute if score anon_WnYlBycD_6 __sandstone matches 1 run return run function sandstone_summit_booth:sections/rhythm/obstacle/g6_m1
execute if score anon_WnYlBycD_6 __sandstone matches 2 run function sandstone_summit_booth:sections/rhythm/obstacle/g6_m2