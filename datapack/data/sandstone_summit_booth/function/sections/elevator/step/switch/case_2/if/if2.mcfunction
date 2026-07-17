execute as @e[tag=sandstone_summit_booth.elevator.car, limit=1] run tp @s -55 63.5 46
scoreboard players set anon_WnYlBycD_0 __sandstone 2
execute as @a[tag=sandstone_summit_booth.elevator.rider] at @s run tp @s ~ 64.03125 ~
fill -57 63 44 -53 63 48 minecraft:barrier
execute as @a[tag=sandstone_summit_booth.elevator.rider] run attribute @s minecraft:gravity modifier remove sandstone_summit_booth:elevator_ride