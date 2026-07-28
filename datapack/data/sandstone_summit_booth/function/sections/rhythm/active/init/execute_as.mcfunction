tp @s -70 64 42 180 0
execute at @s run playsound minecraft:entity.player.levelup master @s
scoreboard players operation @s sandstone_summit_booth.rhythm.wall.lives = anon_WnYlBycD_45 __sandstone
scoreboard players set @s sandstone_summit_booth.rhythm.hits 0
effect give @s minecraft:instant_health 1 126 true
effect give @s minecraft:saturation 99999 0 true
scoreboard players set @s sandstone_summit_booth.rhythm.points 0
scoreboard players set @s sandstone_summit_booth.rhythm.combo 0
scoreboard players set @s sandstone_summit_booth.rhythm.score 0