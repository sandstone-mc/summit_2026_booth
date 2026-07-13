scoreboard players operation @s sandstone_summit_booth.npc.dialogue.reveal_cut = @s sandstone_summit_booth.npc.dialogue.reveal_count
data modify storage sandstone_summit_booth:npcs_reveal full set value 'A bunch of people poured lots time into making this booth happen.'
execute store result storage sandstone_summit_booth:npcs_reveal end int 1 run scoreboard players get @s sandstone_summit_booth.npc.dialogue.reveal_cut
function sandstone_summit_booth:sections/npcs/dialogue/_compute_reveal_cut with storage sandstone_summit_booth:npcs_reveal {}
data modify storage sandstone_summit_booth:npcs_reveal runs set value [{text:''}]
data modify storage sandstone_summit_booth:npcs_reveal runs[0].text set from storage sandstone_summit_booth:npcs_reveal cut
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/credits/render/switch/case_1/if/execute_at