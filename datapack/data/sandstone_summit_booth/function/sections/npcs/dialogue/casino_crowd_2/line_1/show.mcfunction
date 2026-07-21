scoreboard players set @s sandstone_summit_booth.npc.dialogue.line 1
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_count 0
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_speed 1
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_delay 1
tag @s add sandstone_summit_booth.npc.dialogue.revealing
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/casino_crowd_2/line_1/show/execute_at
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_total 81
function sandstone_summit_booth:sections/npcs/dialogue/casino_crowd_2/render