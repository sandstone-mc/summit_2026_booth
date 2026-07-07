scoreboard players add anon_WnYlBycD_3 __sandstone 1
execute if score anon_WnYlBycD_3 __sandstone matches 3.. run scoreboard players set anon_WnYlBycD_3 __sandstone 0
function sandstone_summit_booth:sections/rhythm/leaderboard/update
execute at @s run playsound minecraft:ui.button.click master @s