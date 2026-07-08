$scoreboard players set @s sandstone_summit_booth.status.entangled_timer $(param_0)
scoreboard players operation @s sandstone_summit_booth.status.entangled_timer *= 20 __sandstone
tag @s add sandstone_summit_booth.status.entangled
attribute @s minecraft:movement_speed modifier add arcane_arts:entangled -0.5 add_multiplied_total