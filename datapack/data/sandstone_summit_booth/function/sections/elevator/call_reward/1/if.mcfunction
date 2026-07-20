scoreboard players set anon_WnYlBycD_1 __sandstone 1
fill -58 84 45 -58 86 46 minecraft:dark_oak_shelf[facing=west]
execute as @e[tag=sandstone_summit_booth.elevator.door.2] run data modify entity @s transformation.scale set value [1f,1f,1f]
fill -58 74 45 -58 77 46 minecraft:dark_oak_shelf[facing=west]
execute as @e[tag=sandstone_summit_booth.elevator.door.2] run data modify entity @s transformation.scale set value [1f,1f,1f]
fill -54 64 49 -55 67 49 minecraft:dark_oak_shelf[facing=south]
execute as @e[tag=sandstone_summit_booth.elevator.door.1] run data modify entity @s transformation.scale set value [1f,1f,1f]
execute as @e[tag=sandstone_summit_booth.elevator.car, limit=1] run tp @s -55 73.5 46
scoreboard players set anon_WnYlBycD_0 __sandstone 1
execute as @a[tag=sandstone_summit_booth.elevator.rider] at @s run tp @s ~ 74.03125 ~
fill -57 73 44 -53 73 48 minecraft:barrier
execute as @a[tag=sandstone_summit_booth.elevator.rider] run function sandstone_summit_booth:sections/elevator/call_reward/1/if/execute_as4
fill -58 74 45 -58 77 46 minecraft:air
execute as @e[tag=sandstone_summit_booth.elevator.door.2] run data modify entity @s transformation.scale set value [0f,0f,0f]
execute as @e[tag=sandstone_summit_booth.elevator.button.0, type=minecraft:block_display] run data modify entity @s block_state.Properties.lit set value 'false'
execute as @e[tag=sandstone_summit_booth.elevator.button.1, type=minecraft:block_display] run data modify entity @s block_state.Properties.lit set value 'true'
execute as @e[tag=sandstone_summit_booth.elevator.button.2, type=minecraft:block_display] run data modify entity @s block_state.Properties.lit set value 'false'