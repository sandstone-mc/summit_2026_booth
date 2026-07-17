scoreboard players add anon_WnYlBycD_41 __sandstone 1
function sandstone_summit_booth:sections/rhythm/leaderboard/scroll
execute if score anon_WnYlBycD_6 __sandstone matches 1 run schedule function sandstone_summit_booth:sections/rhythm/leaderboard/scroll_loop 4t replace
execute if score anon_WnYlBycD_6 __sandstone matches 2 run schedule function sandstone_summit_booth:sections/rhythm/leaderboard/scroll_loop 4t replace