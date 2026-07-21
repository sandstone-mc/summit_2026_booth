execute as @e[tag=sandstone_summit_booth.elevator.car, limit=1] at @a[tag=sandstone_summit_booth.elevator.driver, gamemode=!spectator, limit=1] run tp @s -55 ~-0.5 46
execute as @a[tag=sandstone_summit_booth.elevator.driver, gamemode=!spectator, limit=1] run function sandstone_summit_booth:sections/elevator/step/if/if2/execute_as
function sandstone_summit_booth:sections/elevator/step/if/if2/if
scoreboard players operation anon_WnYlBycD_3 __sandstone = elevator.rider_y_0_WnYlBycD __sandstone
execute if score anon_WnYlBycD_4 __sandstone matches 21.. run function sandstone_summit_booth:sections/elevator/step/if/if2/if2
return run function sandstone_summit_booth:sections/elevator/step/switch2