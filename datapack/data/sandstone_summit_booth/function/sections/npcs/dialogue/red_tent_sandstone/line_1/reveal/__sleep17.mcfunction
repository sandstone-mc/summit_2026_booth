tag @s remove __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_1.reveal
execute if score @s sandstone_summit_booth.npc.dialogue.line matches 1 run function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/line_1/reveal/if17
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_1.reveal run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_1.reveal 1
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_1.reveal
schedule function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/line_1/reveal/__sleep18/_context 1t replace