scoreboard players operation @s sandstone_summit_booth.rhythm.wall.temp = @s sandstone_summit_booth.rhythm.wall.age
execute if score @s sandstone_summit_booth.rhythm.wall.temp > $travel sandstone_summit_booth.rhythm.wall.move run scoreboard players operation @s sandstone_summit_booth.rhythm.wall.temp = $travel sandstone_summit_booth.rhythm.wall.move
scoreboard players operation @s sandstone_summit_booth.rhythm.wall.temp *= $numerator sandstone_summit_booth.rhythm.wall.move
scoreboard players operation @s sandstone_summit_booth.rhythm.wall.temp /= $travel sandstone_summit_booth.rhythm.wall.move
scoreboard players operation @s sandstone_summit_booth.rhythm.wall.temp *= $tsign sandstone_summit_booth.rhythm.wall.move
scoreboard players set @s sandstone_summit_booth.rhythm.wall.pos 23000
scoreboard players operation @s sandstone_summit_booth.rhythm.wall.pos += @s sandstone_summit_booth.rhythm.wall.temp
scoreboard players operation @s sandstone_summit_booth.rhythm.wall.pos += @s sandstone_summit_booth.rhythm.wall.depth
execute store result storage ssb.rhythm:temp pos double 0.001 run scoreboard players get @s sandstone_summit_booth.rhythm.wall.pos
function sandstone_summit_booth:sections/rhythm/wall/tp with storage ssb.rhythm:temp