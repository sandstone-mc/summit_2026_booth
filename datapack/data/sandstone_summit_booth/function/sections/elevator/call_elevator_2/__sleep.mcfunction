execute as @e[tag=sandstone_summit_booth.elevator.car, type=minecraft:block_display, limit=1] run tp @s -55 63.5 46
scoreboard players set anon_WnYlBycD_0 __sandstone 2
execute as @a[tag=sandstone_summit_booth.elevator.rider] at @s run tp @s ~ 64.03125 ~
fill -57 63 44 -53 63 48 minecraft:barrier
fill -54 63 48 -55 63 48 minecraft:barrier
execute as @a[tag=sandstone_summit_booth.elevator.rider] run function sandstone_summit_booth:sections/elevator/call_elevator_2/execute_as7
fill -54 64 48 -55 67 49 minecraft:air strict
execute as @e[tag=sandstone_summit_booth.elevator.door.1, type=minecraft:block_display] run data modify entity @s transformation.scale set value [0f,0f,0f]
execute as @e[tag=sandstone_summit_booth.elevator.button.2, tag=sandstone_summit_booth.elevator.button, type=minecraft:block_display] run data modify entity @s block_state.Properties.lit set value 'false'
scoreboard players set anon_WnYlBycD_2 __sandstone 0