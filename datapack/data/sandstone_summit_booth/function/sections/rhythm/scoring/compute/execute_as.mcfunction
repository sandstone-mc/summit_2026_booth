scoreboard players operation @s sandstone_summit_booth.rhythm.combo_temp = @s sandstone_summit_booth.rhythm.combo
scoreboard players add @s sandstone_summit_booth.rhythm.combo_temp 50
scoreboard players operation @s sandstone_summit_booth.rhythm.score = @s sandstone_summit_booth.rhythm.points
scoreboard players operation @s sandstone_summit_booth.rhythm.score *= @s sandstone_summit_booth.rhythm.combo_temp
scoreboard players operation @s sandstone_summit_booth.rhythm.score /= 50 __sandstone
title @s times 10 60 20
title @s title {"text":"Game Over!","color":"red","bold":true}
title @s subtitle [{"text":"Score: ","color":"gray"},{"score":{"name":"@s","objective":"sandstone_summit_booth.rhythm.score"}}]
tellraw @s [{"text":"♪ ","color":"gold"},{"text":"Final score: ","color":"gray"},{"score":{"name":"@s","objective":"sandstone_summit_booth.rhythm.score"}}]