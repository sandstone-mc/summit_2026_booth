advancement revoke @s only sandstone_summit_booth:sections/elevator/ring_bell_2
scoreboard players set anon_WnYlBycD_1 __sandstone 2
fill -58 84 45 -58 86 46 minecraft:dark_oak_shelf[facing=west]
fill -57 84 45 -57 86 46 minecraft:oxidized_copper_trapdoor[open=true,facing=east]
execute as @e[tag=sandstone_summit_booth.elevator.door.2] run data modify entity @s transformation.scale set value [1f,1f,1f]
fill -58 74 45 -58 77 46 minecraft:dark_oak_shelf[facing=west]
fill -57 74 45 -57 77 46 minecraft:oxidized_copper_trapdoor[open=true,facing=east]
execute as @e[tag=sandstone_summit_booth.elevator.door.2] run data modify entity @s transformation.scale set value [1f,1f,1f]
fill -54 64 49 -55 67 49 minecraft:dark_oak_shelf[facing=south]
fill -54 64 48 -55 67 48 minecraft:oxidized_copper_trapdoor[open=true,facing=north]
execute as @e[tag=sandstone_summit_booth.elevator.door.1] run data modify entity @s transformation.scale set value [1f,1f,1f]
execute as @e[tag=sandstone_summit_booth.elevator.car, limit=1] run tp @s -55 63.5 46
scoreboard players set anon_WnYlBycD_0 __sandstone 2
execute as @a[tag=sandstone_summit_booth.elevator.rider] at @s run tp @s ~ 64.03125 ~
fill -57 63 44 -53 63 48 minecraft:barrier
fill -54 63 48 -55 63 48 minecraft:barrier
execute as @a[tag=sandstone_summit_booth.elevator.rider] run function sandstone_summit_booth:sections/elevator/call_elevator_2/execute_as4
fill -54 64 48 -55 67 49 minecraft:air
execute as @e[tag=sandstone_summit_booth.elevator.door.1] run data modify entity @s transformation.scale set value [0f,0f,0f]
execute as @e[tag=sandstone_summit_booth.elevator.button.0, type=minecraft:block_display] run data modify entity @s block_state.Properties.lit set value 'false'
execute as @e[tag=sandstone_summit_booth.elevator.button.1, type=minecraft:block_display] run data modify entity @s block_state.Properties.lit set value 'false'
execute as @e[tag=sandstone_summit_booth.elevator.button.2, type=minecraft:block_display] run data modify entity @s block_state.Properties.lit set value 'true'
scoreboard players set anon_WnYlBycD_2 __sandstone 0