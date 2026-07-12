tag @s remove __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_4.reveal
execute if score @s sandstone_summit_booth.npc.dialogue.line matches 4 run function sandstone_summit_booth:sections/npcs/dialogue/glitchy/line_4/reveal/if32
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_4.reveal run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_4.reveal 1
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_4.reveal
schedule function sandstone_summit_booth:sections/npcs/dialogue/glitchy/line_4/reveal/__sleep33/_context 1t replace