advancement revoke @s only sandstone_summit_booth:sections/elevator/ring_bell_2
scoreboard players set anon_WnYlBycD_1 __sandstone 2
scoreboard players set anon_WnYlBycD_2 __sandstone 1
execute as @e[tag=sandstone_summit_booth.elevator.button.0, type=minecraft:block_display] run data modify entity @s block_state.Properties.lit set value 'false'
execute as @e[tag=sandstone_summit_booth.elevator.button.1, type=minecraft:block_display] run data modify entity @s block_state.Properties.lit set value 'false'
execute as @e[tag=sandstone_summit_booth.elevator.button.2, type=minecraft:block_display] run data modify entity @s block_state.Properties.lit set value 'true'
function sandstone_summit_booth:sections/elevator/call_elevator_2/if