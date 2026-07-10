execute if entity @s[tag=!summit.in_booth.sandstone_summit_booth] run return 1
tag @s remove summit.in_booth.sandstone_summit_booth
scoreboard players reset @s summit.below_name
function sandstone_summit_booth:clean_player
