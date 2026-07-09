execute if score @s sandstone_summit_booth.rlb.s1 matches 0.. run return run execute if score @s sandstone_summit_booth.rhythm.score > @s sandstone_summit_booth.rlb.s1 run function sandstone_summit_booth:sections/rhythm/leaderboard/save/execute_as/if2/if/if/return_run/if
scoreboard players operation @s sandstone_summit_booth.rlb.s1 = @s sandstone_summit_booth.rhythm.score
tag @s add ssb.rhythm.pb