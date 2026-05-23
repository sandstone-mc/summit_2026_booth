execute store result score $path sandstone_summit_booth.ssb_pkp run random value 0..7 sandstone_summit_booth:pk_path
scoreboard players set $active sandstone_summit_booth.ssb_pka 1
execute in sandstone_summit_booth:rhythm as @a[tag=ssb.player, tag=ssb.alive] run function sandstone_summit_booth:sections/rythm/parkour/step_0/execute_in
execute if score $path sandstone_summit_booth.ssb_pkp matches 0 run return run execute in sandstone_summit_booth:rhythm run function sandstone_summit_booth:sections/rythm/parkour/step_0/if/return_run/execute_in
execute if score $path sandstone_summit_booth.ssb_pkp matches 1 run return run execute in sandstone_summit_booth:rhythm run function sandstone_summit_booth:sections/rythm/parkour/step_0/elseif/return_run/execute_in
execute if score $path sandstone_summit_booth.ssb_pkp matches 2 run return run execute in sandstone_summit_booth:rhythm run function sandstone_summit_booth:sections/rythm/parkour/step_0/elseif2/return_run/execute_in
execute if score $path sandstone_summit_booth.ssb_pkp matches 3 run return run execute in sandstone_summit_booth:rhythm run function sandstone_summit_booth:sections/rythm/parkour/step_0/elseif3/return_run/execute_in
execute if score $path sandstone_summit_booth.ssb_pkp matches 4 run return run execute in sandstone_summit_booth:rhythm run function sandstone_summit_booth:sections/rythm/parkour/step_0/elseif4/return_run/execute_in
execute if score $path sandstone_summit_booth.ssb_pkp matches 5 run return run execute in sandstone_summit_booth:rhythm run function sandstone_summit_booth:sections/rythm/parkour/step_0/elseif5/return_run/execute_in
execute if score $path sandstone_summit_booth.ssb_pkp matches 6 run return run execute in sandstone_summit_booth:rhythm run function sandstone_summit_booth:sections/rythm/parkour/step_0/elseif6/return_run/execute_in
execute if score $path sandstone_summit_booth.ssb_pkp matches 7 run function sandstone_summit_booth:sections/rythm/parkour/step_0/elseif7