tag @s remove __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.blue_tent_guide.line_2.reveal
execute if score @s sandstone_summit_booth.npc.dialogue.line matches 2 run function sandstone_summit_booth:sections/npcs/dialogue/blue_tent_guide/line_2/reveal/if51
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.blue_tent_guide.line_2.reveal run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.blue_tent_guide.line_2.reveal 1
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.blue_tent_guide.line_2.reveal
schedule function sandstone_summit_booth:sections/npcs/dialogue/blue_tent_guide/line_2/reveal/__sleep52/_context 1t replace