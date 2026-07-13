scoreboard players set @s sandstone_summit_booth.npc.dialogue.line 3
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_count 0
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_speed 2
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_delay 2
tag @s add sandstone_summit_booth.npc.dialogue.revealing
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/glitchy/line_3/show/execute_at
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_total 7
function sandstone_summit_booth:sections/npcs/dialogue/glitchy/render