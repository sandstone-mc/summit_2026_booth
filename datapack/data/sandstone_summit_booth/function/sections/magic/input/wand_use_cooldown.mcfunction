scoreboard players remove @s sandstone_summit_booth.wand_cooldown 1
execute if score @s sandstone_summit_booth.wand_cooldown matches 1.. run return run advancement revoke @s only sandstone_summit_booth:input/wand_use_cooldown
scoreboard players reset @s sandstone_summit_booth.wand_cooldown