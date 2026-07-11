tag @s remove __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_4.show
execute if score @s sandstone_summit_booth.npc.dialogue.line matches 4 run function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/line_4/show/if32
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_4.show run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_4.show 2
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.red_tent_sandstone.line_4.show
schedule function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/line_4/show/__sleep33/_context 2t replace