execute as @a[advancements={sandstone_summit_booth:ui_lb_song=true}] run function sandstone_summit_booth:sections/rhythm/leaderboard/tick/execute_as
execute as @a[advancements={sandstone_summit_booth:ui_lb_cat=true}] run function sandstone_summit_booth:sections/rhythm/leaderboard/tick/execute_as2
execute as @a[advancements={sandstone_summit_booth:ui_lb_my=true}] run function sandstone_summit_booth:sections/rhythm/leaderboard/tick/execute_as3
scoreboard players add $scroll_t_lb sandstone_summit_booth.rhythm.state 1
execute if score $scroll_t_lb sandstone_summit_booth.rhythm.state matches 4.. run function sandstone_summit_booth:sections/rhythm/leaderboard/tick/if