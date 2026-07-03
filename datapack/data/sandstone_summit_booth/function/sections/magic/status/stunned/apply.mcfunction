$scoreboard players set @s sandstone_summit_booth.status.stunned_timer $(param_0)
scoreboard players operation @s sandstone_summit_booth.status.stunned_timer *= 20 __sandstone
tag @s add sandstone_summit_booth.status.stunned
attribute @s minecraft:movement_speed modifier add sandstone_summit_booth:stunned -0.3 add_multiplied_total