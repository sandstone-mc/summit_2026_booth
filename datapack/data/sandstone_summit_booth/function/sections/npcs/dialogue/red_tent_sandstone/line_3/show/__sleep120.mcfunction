tag @s remove __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_3.show
execute if score @s sandstone_summit_booth.npc.dialogue.line matches 3 run function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/line_3/show/if120
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_3.show run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_3.show 1
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_3.show
schedule function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/line_3/show/__sleep121/_context 1t replace