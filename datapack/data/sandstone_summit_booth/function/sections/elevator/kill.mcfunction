execute as @a[tag=sandstone_summit_booth.elevator.rider] run function sandstone_summit_booth:sections/elevator/kill/execute_as
kill @e[tag=sandstone_summit_booth.elevator.car, limit=1]
kill @e[tag=sandstone_summit_booth.elevator.car_part]
fill -57 83 44 -53 83 48 minecraft:air replace minecraft:barrier
fill -57 73 44 -53 73 48 minecraft:air replace minecraft:barrier
fill -57 63 44 -53 63 48 minecraft:air replace minecraft:barrier