fill -58 84 45 -58 86 46 minecraft:dark_oak_shelf[facing=west] strict
fill -57 84 45 -57 86 46 minecraft:oxidized_copper_trapdoor[open=true,facing=east] strict
execute as @e[tag=sandstone_summit_booth.elevator.door.2, type=minecraft:block_display] run data modify entity @s transformation.scale set value [1f,1f,1f]
fill -58 74 45 -58 77 46 minecraft:dark_oak_shelf[facing=west] strict
fill -57 74 45 -57 77 46 minecraft:oxidized_copper_trapdoor[open=true,facing=east] strict
execute as @e[tag=sandstone_summit_booth.elevator.door.2, type=minecraft:block_display] run data modify entity @s transformation.scale set value [1f,1f,1f]
fill -54 64 49 -55 67 49 minecraft:dark_oak_shelf[facing=south] strict
fill -54 64 48 -55 67 48 minecraft:oxidized_copper_trapdoor[open=true,facing=north] strict
execute as @e[tag=sandstone_summit_booth.elevator.door.1, type=minecraft:block_display] run data modify entity @s transformation.scale set value [1f,1f,1f]
function sandstone_summit_booth:sections/elevator/call_elevator_1/switch
execute unless entity @a[tag=sandstone_summit_booth.elevator.driver, gamemode=!spectator, limit=1] run function sandstone_summit_booth:sections/elevator/call_elevator_1/0_if/return_run/if
execute as @a[tag=sandstone_summit_booth.elevator.rider] run function sandstone_summit_booth:sections/elevator/call_elevator_1/0_if/return_run/execute_as4
execute if score anon_WnYlBycD_1 __sandstone < anon_WnYlBycD_0 __sandstone run function sandstone_summit_booth:sections/elevator/call_elevator_1/0_if/return_run/if2
function sandstone_summit_booth:sections/elevator/call_elevator_1/switch5
scoreboard players set anon_WnYlBycD_2 __sandstone 1