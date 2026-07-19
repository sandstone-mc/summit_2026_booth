execute as @e[tag=sandstone_summit_booth.elevator.car, limit=1] run tp @s -55 73.5 46
scoreboard players set anon_WnYlBycD_0 __sandstone 1
execute as @a[tag=sandstone_summit_booth.elevator.rider] at @s run tp @s ~ 74.03125 ~
fill -57 73 44 -53 73 48 minecraft:barrier
execute as @a[tag=sandstone_summit_booth.elevator.rider] run function sandstone_summit_booth:sections/elevator/step/switch/case_1/if/if/return_run/if/execute_as
fill -58 74 45 -58 77 46 minecraft:air
execute as @e[tag=sandstone_summit_booth.elevator.door.2] run data modify entity @s transformation.scale set value [0f,0f,0f]