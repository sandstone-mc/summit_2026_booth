execute as @a[tag=sandstone_summit_booth.elevator.rider] run function sandstone_summit_booth:sections/elevator/kill/execute_as
kill @e[tag=sandstone_summit_booth.elevator.car, type=minecraft:block_display, limit=1]
kill @e[tag=sandstone_summit_booth.elevator.car_part]
kill @e[tag=sandstone_summit_booth.elevator.button]
fill -57 83 44 -53 83 48 minecraft:air replace minecraft:barrier
fill -57 83 45 -57 83 46 minecraft:oxidized_copper_trapdoor[open=true,facing=east]
fill -57 73 44 -53 73 48 minecraft:air replace minecraft:barrier
fill -57 73 45 -57 73 46 minecraft:oxidized_copper_trapdoor[open=true,facing=east]
fill -57 63 44 -53 63 48 minecraft:air replace minecraft:barrier
fill -54 63 48 -55 63 48 minecraft:oxidized_copper_trapdoor[open=true,facing=north]
fill -58 84 45 -58 86 46 minecraft:dark_oak_shelf[facing=west] strict
fill -57 84 45 -57 86 46 minecraft:oxidized_copper_trapdoor[open=true,facing=east] strict
execute as @e[tag=sandstone_summit_booth.elevator.door.2, type=minecraft:block_display] run data modify entity @s transformation.scale set value [1f,1f,1f]
fill -58 74 45 -58 77 46 minecraft:dark_oak_shelf[facing=west] strict
fill -57 74 45 -57 77 46 minecraft:oxidized_copper_trapdoor[open=true,facing=east] strict
execute as @e[tag=sandstone_summit_booth.elevator.door.2, type=minecraft:block_display] run data modify entity @s transformation.scale set value [1f,1f,1f]
fill -54 64 49 -55 67 49 minecraft:dark_oak_shelf[facing=south] strict
fill -54 64 48 -55 67 48 minecraft:oxidized_copper_trapdoor[open=true,facing=north] strict
execute as @e[tag=sandstone_summit_booth.elevator.door.1, type=minecraft:block_display] run data modify entity @s transformation.scale set value [1f,1f,1f]
scoreboard players set anon_WnYlBycD_2 __sandstone -1