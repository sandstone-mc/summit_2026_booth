scoreboard players add $lb_song sandstone_summit_booth.rhythm.state 1
execute if score $lb_song sandstone_summit_booth.rhythm.state matches 3.. run scoreboard players set $lb_song sandstone_summit_booth.rhythm.state 0
function sandstone_summit_booth:sections/rhythm/leaderboard/update
execute at @s run playsound minecraft:ui.button.click master @s