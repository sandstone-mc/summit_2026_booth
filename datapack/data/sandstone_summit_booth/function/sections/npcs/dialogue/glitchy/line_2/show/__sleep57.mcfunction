tag @s remove __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_2.show
execute if score @s sandstone_summit_booth.npc.dialogue.line matches 2 run function sandstone_summit_booth:sections/npcs/dialogue/glitchy/line_2/show/if57
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_2.show run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_2.show 1
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_2.show
schedule function sandstone_summit_booth:sections/npcs/dialogue/glitchy/line_2/show/__sleep58/_context 1t replace