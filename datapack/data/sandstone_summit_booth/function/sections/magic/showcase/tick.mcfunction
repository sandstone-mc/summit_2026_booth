tag @p remove sandstone_summit_booth.showcase.in_booth
execute as @e[tag=sandstone_summit_booth.showcase.marker, type=minecraft:marker] at @s run function sandstone_summit_booth:sections/magic/showcase/tick/execute_as
execute if score #global sandstone_summit_booth.showcase.state matches 0 run function sandstone_summit_booth:sections/magic/showcase/tick/if
execute if score #global sandstone_summit_booth.showcase.state matches 3 run function sandstone_summit_booth:sections/magic/showcase/tick/if2
execute if score #global sandstone_summit_booth.showcase.state matches 1.. run function sandstone_summit_booth:sections/magic/showcase/tick/if3
execute as @a[scores={sandstone_summit_booth.showcase.reset=1..}] run function sandstone_summit_booth:sections/magic/showcase/tick/execute_as2