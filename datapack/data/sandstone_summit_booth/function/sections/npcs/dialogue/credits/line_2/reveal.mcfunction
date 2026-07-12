scoreboard players set @s sandstone_summit_booth.npc.dialogue.line 2
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/credits/line_2/reveal/execute_at
execute if score @s sandstone_summit_booth.npc.dialogue.line matches 2 run function sandstone_summit_booth:sections/npcs/dialogue/credits/line_2/reveal/if
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.credits.line_2.reveal run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.credits.line_2.reveal 40
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.npcs.dialogue.credits.line_2.reveal
schedule function sandstone_summit_booth:sections/npcs/dialogue/credits/line_2/reveal/__sleep/_context 40t replace