scoreboard players set @s sandstone_summit_booth.npc.dialogue.line 2
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_count 0
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_speed 1
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_delay 1
tag @s add sandstone_summit_booth.npc.dialogue.revealing
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/credits/line_2/show/execute_at
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_total 44
function sandstone_summit_booth:sections/npcs/dialogue/credits/render