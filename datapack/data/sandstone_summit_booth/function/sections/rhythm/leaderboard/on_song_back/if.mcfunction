scoreboard players remove anon_WnYlBycD_9 __sandstone 1
execute if score anon_WnYlBycD_9 __sandstone matches ..-1 run scoreboard players set anon_WnYlBycD_9 __sandstone 2
function sandstone_summit_booth:sections/rhythm/leaderboard/update
execute at @s run playsound minecraft:ui.button.click master @s