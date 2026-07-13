execute store result score @s sandstone_summit_booth.npc.dialogue.variant run random value 0..1 sandstone_summit_booth:dialogue_variant
scoreboard players set @s sandstone_summit_booth.npc.dialogue.line 1
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_count 0
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_speed 1
scoreboard players set @s sandstone_summit_booth.npc.dialogue.reveal_delay 1
tag @s add sandstone_summit_booth.npc.dialogue.revealing
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/glitchy/line_1/reveal/execute_at
function sandstone_summit_booth:sections/npcs/dialogue/glitchy/render