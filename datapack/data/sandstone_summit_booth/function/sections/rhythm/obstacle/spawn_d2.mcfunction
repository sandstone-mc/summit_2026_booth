scoreboard players set $continue sandstone_summit_booth.rhythm.wall_variable 0
execute if score $last sandstone_summit_booth.rhythm.wall_variable matches 1.. run function sandstone_summit_booth:sections/rhythm/obstacle/spawn_d2/if
execute if score $continue sandstone_summit_booth.rhythm.wall_variable matches 0 run function sandstone_summit_booth:sections/rhythm/obstacle/spawn_d2/if2