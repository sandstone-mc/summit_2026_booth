scoreboard players set @s sandstone_summit_booth.npc.dialogue.line 2
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_count 0
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_speed 1
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_delay 1
tag @s add sandstone_summit_booth.npc.dialogue.revealing
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/line_2/show/execute_at
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_total 97
function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/render