tag @s remove __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.casino_crowd_1.line_0.variant_2
execute if score @s sandstone_summit_booth.npc.dialogue.line matches 0 run function sandstone_summit_booth:sections/npcs/dialogue/casino_crowd_1/line_0/variant_2/if23
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.casino_crowd_1.line_0.variant_2 run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.casino_crowd_1.line_0.variant_2 1
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.casino_crowd_1.line_0.variant_2
schedule function sandstone_summit_booth:sections/npcs/dialogue/casino_crowd_1/line_0/variant_2/__sleep24/_context 1t replace