execute as @a[advancements={sandstone_summit_booth:ui_song_cycle=true}] run function sandstone_summit_booth:sections/rhythm/settings/tick/execute_as
execute as @a[advancements={sandstone_summit_booth:ui_lives_cycle=true}] run function sandstone_summit_booth:sections/rhythm/settings/tick/execute_as2
execute as @a[advancements={sandstone_summit_booth:ui_map_cycle=true}] run function sandstone_summit_booth:sections/rhythm/settings/tick/execute_as3
execute as @a[advancements={sandstone_summit_booth:ui_start_game=true}] run function sandstone_summit_booth:sections/rhythm/settings/tick/execute_as4
scoreboard players add $scroll_t sandstone_summit_booth.rhythm.state 1
execute if score $scroll_t sandstone_summit_booth.rhythm.state matches 4.. run function sandstone_summit_booth:sections/rhythm/settings/tick/if