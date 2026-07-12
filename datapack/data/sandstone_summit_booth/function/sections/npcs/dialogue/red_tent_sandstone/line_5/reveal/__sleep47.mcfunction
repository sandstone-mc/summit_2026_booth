tag @s remove __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_5.reveal
execute if score @s sandstone_summit_booth.npc.dialogue.line matches 5 run function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/line_5/reveal/if47
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_5.reveal run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_5.reveal 1
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_5.reveal
schedule function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/line_5/reveal/__sleep48/_context 1t replace