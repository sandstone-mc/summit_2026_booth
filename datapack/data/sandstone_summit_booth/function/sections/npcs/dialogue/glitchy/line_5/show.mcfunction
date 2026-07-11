scoreboard players set @s sandstone_summit_booth.npc.dialogue.line 5
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/glitchy/line_5/show/execute_at
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_5.show run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_5.show 1
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_5.show
schedule function sandstone_summit_booth:sections/npcs/dialogue/glitchy/line_5/show/__sleep/_context 1t replace