execute as @e[tag=sandstone_summit_booth.elevator.car, limit=1] run tp @s -55 73.5 46
scoreboard players set anon_WnYlBycD_0 __sandstone 1
execute as @a[tag=sandstone_summit_booth.elevator.rider] at @s run tp @s ~ 74.03125 ~
fill -57 73 44 -53 73 48 minecraft:barrier
execute as @a[tag=sandstone_summit_booth.elevator.rider] run attribute @s minecraft:gravity modifier remove sandstone_summit_booth:elevator_ride