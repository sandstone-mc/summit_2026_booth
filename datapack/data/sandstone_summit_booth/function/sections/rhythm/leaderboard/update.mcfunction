scoreboard players set $scroll_lb sandstone_summit_booth.rhythm.state 0
scoreboard players set $scroll_t_lb sandstone_summit_booth.rhythm.state 0
function sandstone_summit_booth:sections/rhythm/leaderboard/sort
execute if score $lb_song sandstone_summit_booth.rhythm.state matches 0 run function sandstone_summit_booth:sections/rhythm/leaderboard/update/if/if
execute if score $lb_song sandstone_summit_booth.rhythm.state matches 1 run function sandstone_summit_booth:sections/rhythm/leaderboard/update/if2/if
execute if score $lb_song sandstone_summit_booth.rhythm.state matches 2 run function sandstone_summit_booth:sections/rhythm/leaderboard/update/if3/if
function sandstone_summit_booth:sections/rhythm/leaderboard/sidebar