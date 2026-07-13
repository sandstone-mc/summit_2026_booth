scoreboard players operation @s sandstone_summit_booth.npc.dialogue.reveal_cut = @s sandstone_summit_booth.npc.dialogue.reveal_count
scoreboard players remove @s sandstone_summit_booth.npc.dialogue.reveal_cut 36
data modify storage sandstone_summit_booth:npcs_reveal full set value ".\nIt's "
execute store result storage sandstone_summit_booth:npcs_reveal end int 1 run scoreboard players get @s sandstone_summit_booth.npc.dialogue.reveal_cut
function sandstone_summit_booth:sections/npcs/dialogue/_compute_reveal_cut with storage sandstone_summit_booth:npcs_reveal {}
data modify storage sandstone_summit_booth:npcs_reveal runs set value [{text:'This whole booth?\nJust lines of '},{text:'code',color:'light_purple'},{text:''}]
data modify storage sandstone_summit_booth:npcs_reveal runs[2].text set from storage sandstone_summit_booth:npcs_reveal cut
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/glitchy/render/switch2/case_0/if3/execute_at