execute as @e[tag=sandstone_summit_booth.elevator.car, limit=1] at @a[tag=sandstone_summit_booth.elevator.driver, limit=1] run tp @s -55 ~-0.5 46
execute as @a[tag=sandstone_summit_booth.elevator.driver, limit=1] run function sandstone_summit_booth:sections/elevator/step/if/if2/execute_as
return run function sandstone_summit_booth:sections/elevator/step/switch