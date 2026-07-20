execute as @a[tag=sandstone_summit_booth.elevator.rider] run function sandstone_summit_booth:sections/elevator/kill/execute_as
kill @e[tag=sandstone_summit_booth.elevator.car, limit=1]
kill @e[tag=sandstone_summit_booth.elevator.car_part]
kill @e[tag=sandstone_summit_booth.elevator.button]
fill -57 83 44 -53 83 48 minecraft:air replace minecraft:barrier
fill -57 73 44 -53 73 48 minecraft:air replace minecraft:barrier
fill -57 63 44 -53 63 48 minecraft:air replace minecraft:barrier
fill -58 84 45 -58 86 46 minecraft:dark_oak_shelf[facing=west]
execute as @e[tag=sandstone_summit_booth.elevator.door.2] run data modify entity @s transformation.scale set value [1f,1f,1f]
fill -58 74 45 -58 77 46 minecraft:dark_oak_shelf[facing=west]
execute as @e[tag=sandstone_summit_booth.elevator.door.2] run data modify entity @s transformation.scale set value [1f,1f,1f]
fill -54 64 49 -55 67 49 minecraft:dark_oak_shelf[facing=south]
execute as @e[tag=sandstone_summit_booth.elevator.door.1] run data modify entity @s transformation.scale set value [1f,1f,1f]