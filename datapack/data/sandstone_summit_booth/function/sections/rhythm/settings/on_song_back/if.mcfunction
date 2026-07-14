scoreboard players remove anon_WnYlBycD_1 __sandstone 1
execute if score anon_WnYlBycD_1 __sandstone matches ..-1 run scoreboard players set anon_WnYlBycD_1 __sandstone 2
scoreboard players set anon_WnYlBycD_46 __sandstone 0
function sandstone_summit_booth:sections/rhythm/settings/song_line
execute at @s run playsound minecraft:ui.button.click master @s