scoreboard players operation @s sandstone_summit_booth.rhythm.combo_temp = @s sandstone_summit_booth.rhythm.combo
scoreboard players add @s sandstone_summit_booth.rhythm.combo_temp 50
scoreboard players operation @s sandstone_summit_booth.rhythm.score = @s sandstone_summit_booth.rhythm.points
scoreboard players operation @s sandstone_summit_booth.rhythm.score *= @s sandstone_summit_booth.rhythm.combo_temp
scoreboard players operation @s sandstone_summit_booth.rhythm.score /= 50 __sandstone