scoreboard players set @s sandstone_summit_booth.npc.dialogue.line 4
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_count 0
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_speed 1
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_delay 1
tag @s add sandstone_summit_booth.npc.dialogue.revealing
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/glitchy/line_4/show/execute_if3/execute_as/if/0_if/return_run/execute_if4/execute_as/execute_at
return run function sandstone_summit_booth:sections/npcs/dialogue/glitchy/render