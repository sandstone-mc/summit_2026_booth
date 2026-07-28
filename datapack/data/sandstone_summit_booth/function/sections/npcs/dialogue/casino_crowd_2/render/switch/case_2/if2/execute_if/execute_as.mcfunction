function summit.balloon:give/sandstone_summit_booth/sand_castle
execute store result score @s sandstone_summit_booth.npc.balloon_cooldown run time query gametime
scoreboard players add @s sandstone_summit_booth.npc.balloon_cooldown 24000