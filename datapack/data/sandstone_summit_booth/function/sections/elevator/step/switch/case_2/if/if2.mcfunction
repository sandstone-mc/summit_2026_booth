execute as @e[tag=sandstone_summit_booth.elevator.car, limit=1] run tp @s -55 63.5 46
scoreboard players set anon_WnYlBycD_0 __sandstone 2
execute as @a[tag=sandstone_summit_booth.elevator.rider] at @s run tp @s ~ 64.03125 ~
fill -57 63 44 -53 63 48 minecraft:barrier
execute as @a[tag=sandstone_summit_booth.elevator.rider] run function sandstone_summit_booth:sections/elevator/step/switch/case_2/if/if2/execute_as
fill -54 64 49 -55 67 49 minecraft:air
execute as @e[tag=sandstone_summit_booth.elevator.door.1] run data modify entity @s transformation.scale set value [0f,0f,0f]