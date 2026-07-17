scoreboard players set anon_WnYlBycD_1 __sandstone 0
function sandstone_summit_booth:sections/elevator/floors/0/go/switch
execute at @e[tag=sandstone_summit_booth.elevator.car, limit=1] positioned ~-2.5 ~0.53125 ~-2.5 as @a[tag=!sandstone_summit_booth.elevator.rider, dx=5, dy=5, dz=5] run tag @s add sandstone_summit_booth.elevator.rider
execute unless entity @a[tag=sandstone_summit_booth.elevator.driver, limit=1] run function sandstone_summit_booth:sections/elevator/floors/0/go/if/if
execute as @a[tag=sandstone_summit_booth.elevator.rider] run function sandstone_summit_booth:sections/elevator/floors/0/go/if/execute_as
execute if score anon_WnYlBycD_1 __sandstone < anon_WnYlBycD_0 __sandstone run function sandstone_summit_booth:sections/elevator/floors/0/go/if/if2