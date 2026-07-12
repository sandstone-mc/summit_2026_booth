scoreboard players set @s sandstone_summit_booth.npc.dialogue.line 1
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/glitchy/line_1/variant_0/execute_at
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_1.variant_0 run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_1.variant_0 1
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_1.variant_0
schedule function sandstone_summit_booth:sections/npcs/dialogue/glitchy/line_1/variant_0/__sleep/_context 1t replace