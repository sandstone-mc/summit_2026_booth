advancement revoke @s only sandstone_summit_booth:sections/elevator/ring_bell_1
scoreboard players set anon_WnYlBycD_1 __sandstone 1
execute if entity @a[tag=sandstone_summit_booth.elevator.rider] run return run function sandstone_summit_booth:sections/elevator/call_elevator_1/0_if/return_run
scoreboard players set anon_WnYlBycD_2 __sandstone 1
execute as @e[tag=sandstone_summit_booth.elevator.button.0, type=minecraft:block_display] run data modify entity @s block_state.Properties.lit set value 'false'
execute as @e[tag=sandstone_summit_booth.elevator.button.1, type=minecraft:block_display] run data modify entity @s block_state.Properties.lit set value 'true'
execute as @e[tag=sandstone_summit_booth.elevator.button.2, type=minecraft:block_display] run data modify entity @s block_state.Properties.lit set value 'false'
fill -58 84 45 -58 86 46 minecraft:dark_oak_shelf[facing=west] strict
fill -57 84 45 -57 86 46 minecraft:oxidized_copper_trapdoor[open=true,facing=east] strict
execute as @e[tag=sandstone_summit_booth.elevator.door.2, type=minecraft:block_display] run data modify entity @s transformation.scale set value [1f,1f,1f]
fill -58 74 45 -58 77 46 minecraft:dark_oak_shelf[facing=west] strict
fill -57 74 45 -57 77 46 minecraft:oxidized_copper_trapdoor[open=true,facing=east] strict
execute as @e[tag=sandstone_summit_booth.elevator.door.2, type=minecraft:block_display] run data modify entity @s transformation.scale set value [1f,1f,1f]
fill -54 64 49 -55 67 49 minecraft:dark_oak_shelf[facing=south] strict
fill -54 64 48 -55 67 48 minecraft:oxidized_copper_trapdoor[open=true,facing=north] strict
execute as @e[tag=sandstone_summit_booth.elevator.door.1, type=minecraft:block_display] run data modify entity @s transformation.scale set value [1f,1f,1f]
schedule function sandstone_summit_booth:sections/elevator/call_elevator_1/__sleep 2s append