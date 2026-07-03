scoreboard players add $lives_idx sandstone_summit_booth.rhythm.state 1
execute if score $lives_idx sandstone_summit_booth.rhythm.state matches 3.. run scoreboard players set $lives_idx sandstone_summit_booth.rhythm.state 0
execute if score $lives_idx sandstone_summit_booth.rhythm.state matches 0 run scoreboard players set $lives sandstone_summit_booth.rhythm.state 1
execute if score $lives_idx sandstone_summit_booth.rhythm.state matches 1 run scoreboard players set $lives sandstone_summit_booth.rhythm.state 3
execute if score $lives_idx sandstone_summit_booth.rhythm.state matches 2 run scoreboard players set $lives sandstone_summit_booth.rhythm.state 5
function sandstone_summit_booth:sections/rhythm/settings/update
execute at @s run playsound minecraft:ui.button.click master @s