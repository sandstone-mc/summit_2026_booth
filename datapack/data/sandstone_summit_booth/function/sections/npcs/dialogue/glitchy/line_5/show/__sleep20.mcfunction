tag @s remove __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_5.show
execute if score @s sandstone_summit_booth.npc.dialogue.line matches 5 run function sandstone_summit_booth:sections/npcs/dialogue/glitchy/line_5/show/if20
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_5.show run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_5.show 1
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.glitchy.line_5.show
schedule function sandstone_summit_booth:sections/npcs/dialogue/glitchy/line_5/show/__sleep21/_context 1t replace