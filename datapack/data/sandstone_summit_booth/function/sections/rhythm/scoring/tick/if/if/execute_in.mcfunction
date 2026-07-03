scoreboard players add @s sandstone_summit_booth.rhythm.points 1
scoreboard players add @s sandstone_summit_booth.rhythm.combo 1
scoreboard players operation $mod sandstone_summit_booth.rhythm.combo = @s sandstone_summit_booth.rhythm.combo
scoreboard players operation $mod sandstone_summit_booth.rhythm.combo %= $div sandstone_summit_booth.rhythm.combo
execute if score $mod sandstone_summit_booth.rhythm.combo matches 0 if score @s sandstone_summit_booth.rhythm.combo matches 1.. run scoreboard players add @s sandstone_summit_booth.rhythm.points 5
function sandstone_summit_booth:sections/rhythm/scoring/tick/if/if/execute_in/if2