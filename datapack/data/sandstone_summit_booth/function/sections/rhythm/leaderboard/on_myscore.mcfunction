execute if score $lb_song sandstone_summit_booth.rhythm.state matches 0 run function sandstone_summit_booth:sections/rhythm/leaderboard/on_myscore/if/if
execute if score $lb_song sandstone_summit_booth.rhythm.state matches 1 run function sandstone_summit_booth:sections/rhythm/leaderboard/on_myscore/if2/if
execute if score $lb_song sandstone_summit_booth.rhythm.state matches 2 run function sandstone_summit_booth:sections/rhythm/leaderboard/on_myscore/if3/if
execute at @s run playsound minecraft:entity.player.levelup master @s