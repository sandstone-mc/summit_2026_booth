attribute @s minecraft:fall_damage_multiplier base set 0
attribute @s minecraft:movement_speed base set 0.1
scoreboard players operation @s sandstone_summit_booth.rhythm.wall.lives = $lives sandstone_summit_booth.rhythm.state
effect give @s minecraft:instant_health 1 126 true
effect give @s minecraft:saturation 99999 0 true
scoreboard players set @s sandstone_summit_booth.rhythm.points 0
scoreboard players set @s sandstone_summit_booth.rhythm.combo 0
scoreboard players set @s sandstone_summit_booth.rhythm.score 0