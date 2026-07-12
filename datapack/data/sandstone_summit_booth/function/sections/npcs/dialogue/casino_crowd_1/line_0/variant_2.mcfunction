scoreboard players set @s sandstone_summit_booth.npc.dialogue.line 0
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/casino_crowd_1/line_0/variant_2/execute_at
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.casino_crowd_1.line_0.variant_2 run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.casino_crowd_1.line_0.variant_2 1
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.casino_crowd_1.line_0.variant_2
schedule function sandstone_summit_booth:sections/npcs/dialogue/casino_crowd_1/line_0/variant_2/__sleep/_context 1t replace