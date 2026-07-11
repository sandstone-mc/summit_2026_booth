scoreboard players set @s sandstone_summit_booth.npc.dialogue.line 2
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/line_2/show/execute_at
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_2.show run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_2.show 1
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_2.show
schedule function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/line_2/show/__sleep/_context 1t replace