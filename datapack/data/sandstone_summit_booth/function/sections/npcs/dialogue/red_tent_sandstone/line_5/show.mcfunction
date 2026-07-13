scoreboard players set @s sandstone_summit_booth.npc.dialogue.line 5
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_count 0
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_speed 1
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_delay 1
tag @s add sandstone_summit_booth.npc.dialogue.revealing
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/line_5/show/execute_at
function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/render