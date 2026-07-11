scoreboard players set @s sandstone_summit_booth.npc.dialogue.line 0
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/credits/line_0/show/execute_at
execute if score @s sandstone_summit_booth.npc.dialogue.line matches 0 run function sandstone_summit_booth:sections/npcs/dialogue/credits/line_0/show/if