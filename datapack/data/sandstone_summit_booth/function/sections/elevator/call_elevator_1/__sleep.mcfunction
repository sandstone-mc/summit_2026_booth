fill -58 84 45 -58 86 46 minecraft:dark_oak_shelf[facing=west] strict
fill -57 84 45 -57 86 46 minecraft:oxidized_copper_trapdoor[open=true,facing=east] strict
execute as @e[tag=sandstone_summit_booth.elevator.door.2] run data modify entity @s transformation.scale set value [1f,1f,1f]
fill -58 74 45 -58 77 46 minecraft:dark_oak_shelf[facing=west] strict
fill -57 74 45 -57 77 46 minecraft:oxidized_copper_trapdoor[open=true,facing=east] strict
execute as @e[tag=sandstone_summit_booth.elevator.door.2] run data modify entity @s transformation.scale set value [1f,1f,1f]
fill -54 64 49 -55 67 49 minecraft:dark_oak_shelf[facing=south] strict
fill -54 64 48 -55 67 48 minecraft:oxidized_copper_trapdoor[open=true,facing=north] strict
execute as @e[tag=sandstone_summit_booth.elevator.door.1] run data modify entity @s transformation.scale set value [1f,1f,1f]
schedule function sandstone_summit_booth:sections/elevator/call_elevator_1/__sleep2 2s append