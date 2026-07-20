scoreboard players remove anon_WnYlBycD_5 __sandstone 1
execute if score anon_WnYlBycD_5 __sandstone matches ..-1 run scoreboard players set anon_WnYlBycD_5 __sandstone 2
function sandstone_summit_booth:sections/rhythm/arena/place_map
function sandstone_summit_booth:sections/rhythm/settings/map_line
execute at @s run playsound minecraft:ui.button.click master @s