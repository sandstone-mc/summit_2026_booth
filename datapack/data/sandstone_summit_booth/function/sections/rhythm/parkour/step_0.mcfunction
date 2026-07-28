execute store result score anon_WnYlBycD_18 __sandstone run random value 0..7 sandstone_summit_booth:pk_path
scoreboard players set anon_WnYlBycD_19 __sandstone 1
execute as @a[tag=snd.rhythm.player] run function sandstone_summit_booth:sections/rhythm/parkour/step_0/execute_as
execute if score anon_WnYlBycD_18 __sandstone matches 0 run return run function sandstone_summit_booth:sections/rhythm/parkour/step_0/0_if/return_run
execute if score anon_WnYlBycD_18 __sandstone matches 1 run return run function sandstone_summit_booth:sections/rhythm/parkour/step_0/1_elseif/return_run
execute if score anon_WnYlBycD_18 __sandstone matches 2 run return run function sandstone_summit_booth:sections/rhythm/parkour/step_0/2_elseif/return_run
execute if score anon_WnYlBycD_18 __sandstone matches 3 run return run function sandstone_summit_booth:sections/rhythm/parkour/step_0/3_elseif/return_run
execute if score anon_WnYlBycD_18 __sandstone matches 4 run return run function sandstone_summit_booth:sections/rhythm/parkour/step_0/4_elseif/return_run
execute if score anon_WnYlBycD_18 __sandstone matches 5 run return run function sandstone_summit_booth:sections/rhythm/parkour/step_0/5_elseif/return_run
execute if score anon_WnYlBycD_18 __sandstone matches 6 run return run function sandstone_summit_booth:sections/rhythm/parkour/step_0/6_elseif/return_run
execute if score anon_WnYlBycD_18 __sandstone matches 7 run return run function sandstone_summit_booth:sections/rhythm/parkour/step_0/7_elseif/return_run