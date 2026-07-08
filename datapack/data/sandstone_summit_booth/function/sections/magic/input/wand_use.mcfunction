execute unless score @s sandstone_summit_booth.wand_cooldown matches 1.. run function sandstone_summit_booth:sections/magic/input/wand_use/if
advancement revoke @s only sandstone_summit_booth:input/wand_use
advancement revoke @s only sandstone_summit_booth:input/wand_use_cooldown
scoreboard players set @s sandstone_summit_booth.wand_cooldown 2