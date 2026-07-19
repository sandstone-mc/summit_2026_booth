execute as @e[tag=sandstone_summit_booth.elevator.car, limit=1] run tp @s -55 83.5 46
scoreboard players set anon_WnYlBycD_0 __sandstone 0
execute as @a[tag=sandstone_summit_booth.elevator.rider] at @s run tp @s ~ 84.03125 ~
fill -57 83 44 -53 83 48 minecraft:barrier
execute as @a[tag=sandstone_summit_booth.elevator.rider] run function sandstone_summit_booth:sections/elevator/step/switch/case_0/if/if2/execute_as
fill -58 84 45 -58 86 46 minecraft:air
execute as @e[tag=sandstone_summit_booth.elevator.door.2] run data modify entity @s transformation.scale set value [0f,0f,0f]