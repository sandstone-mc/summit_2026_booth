function sandstone_summit_booth:sections/rhythm/arena/clear_map
scoreboard players add $map_select sandstone_summit_booth.rhythm.state 1
execute if score $map_select sandstone_summit_booth.rhythm.state matches 3.. run scoreboard players set $map_select sandstone_summit_booth.rhythm.state 0
function sandstone_summit_booth:sections/rhythm/arena/place_map
function sandstone_summit_booth:sections/rhythm/settings/update
execute at @s run playsound minecraft:ui.button.click master @s