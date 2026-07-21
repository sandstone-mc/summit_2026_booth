scoreboard players operation @s sandstone_summit_booth.rhythm.wall.temp = @s sandstone_summit_booth.rhythm.wall.age
execute if score @s sandstone_summit_booth.rhythm.wall.temp > anon_WnYlBycD_23 __sandstone run scoreboard players operation @s sandstone_summit_booth.rhythm.wall.temp = anon_WnYlBycD_23 __sandstone
scoreboard players operation @s sandstone_summit_booth.rhythm.wall.temp *= anon_WnYlBycD_22 __sandstone
scoreboard players operation @s sandstone_summit_booth.rhythm.wall.temp /= anon_WnYlBycD_23 __sandstone
scoreboard players set @s sandstone_summit_booth.rhythm.wall.pos 22000
scoreboard players operation @s sandstone_summit_booth.rhythm.wall.pos += @s sandstone_summit_booth.rhythm.wall.temp
scoreboard players operation @s sandstone_summit_booth.rhythm.wall.pos += @s sandstone_summit_booth.rhythm.wall.depth
execute store result storage sandstone_summit_booth:temp pos double 0.001 run scoreboard players get @s sandstone_summit_booth.rhythm.wall.pos
function sandstone_summit_booth:sections/rhythm/wall/tp with storage sandstone_summit_booth:temp