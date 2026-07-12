scoreboard players set @s sandstone_summit_booth.npc.dialogue.line 3
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/glitchy/line_3/reveal/execute_at
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_3.reveal run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_3.reveal 2
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_3.reveal
schedule function sandstone_summit_booth:sections/npcs/dialogue/glitchy/line_3/reveal/__sleep/_context 2t replace