tag @s remove __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_0.show
execute if score @s sandstone_summit_booth.npc.dialogue.line matches 0 run function sandstone_summit_booth:sections/npcs/dialogue/glitchy/line_0/show/if86
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_0.show run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_0.show 1
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_0.show
schedule function sandstone_summit_booth:sections/npcs/dialogue/glitchy/line_0/show/__sleep87/_context 1t replace