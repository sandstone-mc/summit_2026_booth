tag @s remove __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.blue_tent_guide.line_1.reveal
execute if score @s sandstone_summit_booth.npc.dialogue.line matches 1 run function sandstone_summit_booth:sections/npcs/dialogue/blue_tent_guide/line_1/reveal/if53
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.blue_tent_guide.line_1.reveal run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.blue_tent_guide.line_1.reveal 1
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.blue_tent_guide.line_1.reveal
schedule function sandstone_summit_booth:sections/npcs/dialogue/blue_tent_guide/line_1/reveal/__sleep54/_context 1t replace