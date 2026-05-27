scoreboard players operation @s sandstone_summit_booth.rhythm.wall.temp = @s sandstone_summit_booth.rhythm.wall.age
scoreboard players operation @s sandstone_summit_booth.rhythm.wall.temp *= $numerator sandstone_summit_booth.rhythm.wall_tick
scoreboard players operation @s sandstone_summit_booth.rhythm.wall.temp /= $travel sandstone_summit_booth.rhythm.wall_tick
scoreboard players set @s sandstone_summit_booth.rhythm.wall.pos 30000
scoreboard players operation @s sandstone_summit_booth.rhythm.wall.pos -= @s sandstone_summit_booth.rhythm.wall.temp
scoreboard players operation @s sandstone_summit_booth.rhythm.wall.pos += @s sandstone_summit_booth.rhythm.wall.depth
execute store result storage ssb.rhythm:temp pos double 0.001 run scoreboard players get @s sandstone_summit_booth.rhythm.wall.pos
function sandstone_summit_booth:sections/rhythm/wall/tp with storage ssb.rhythm:temp