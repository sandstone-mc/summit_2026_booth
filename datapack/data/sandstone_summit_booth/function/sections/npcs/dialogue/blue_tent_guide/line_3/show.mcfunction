scoreboard players set @s sandstone_summit_booth.npc.dialogue.line 3
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_count 0
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_speed 1
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_delay 1
tag @s add sandstone_summit_booth.npc.dialogue.revealing
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/blue_tent_guide/line_3/show/execute_at
function sandstone_summit_booth:sections/npcs/dialogue/blue_tent_guide/render