scoreboard players set @s sandstone_summit_booth.npc.dialogue.line 6
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/line_6/reveal/execute_at
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_6.reveal run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_6.reveal 1
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_6.reveal
schedule function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/line_6/reveal/__sleep/_context 1t replace