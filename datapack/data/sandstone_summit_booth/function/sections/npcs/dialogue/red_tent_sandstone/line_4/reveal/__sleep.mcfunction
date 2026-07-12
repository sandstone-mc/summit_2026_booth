tag @s remove __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_4.reveal
execute if score @s sandstone_summit_booth.npc.dialogue.line matches 4 run function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/line_4/reveal/if
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_4.reveal run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_4.reveal 2
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_4.reveal
schedule function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/line_4/reveal/__sleep2/_context 2t replace