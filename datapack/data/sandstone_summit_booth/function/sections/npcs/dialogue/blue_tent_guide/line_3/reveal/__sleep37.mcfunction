tag @s remove __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.blue_tent_guide.line_3.reveal
execute if score @s sandstone_summit_booth.npc.dialogue.line matches 3 run function sandstone_summit_booth:sections/npcs/dialogue/blue_tent_guide/line_3/reveal/if37
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.blue_tent_guide.line_3.reveal run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.blue_tent_guide.line_3.reveal 1
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.blue_tent_guide.line_3.reveal
schedule function sandstone_summit_booth:sections/npcs/dialogue/blue_tent_guide/line_3/reveal/__sleep38/_context 1t replace