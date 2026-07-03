scoreboard players set $scroll_set sandstone_summit_booth.rhythm.state 0
scoreboard players set $scroll_t sandstone_summit_booth.rhythm.state 0
execute if score $status sandstone_summit_booth.rhythm.state matches 2.. run return run data merge entity @e[tag=ssb.ui.set.txt, limit=1] {text:[{text:'SETTINGS  ',color:'white',bold:true},{text:'\n\n\n\n'},{text:'  🎵 Match in progress  ',color:'gold',bold:true},{text:'\n\n\n\n\n\n                                   '}]}
execute if score $song_select sandstone_summit_booth.rhythm.state matches 0 run function sandstone_summit_booth:sections/rhythm/settings/update/if2
execute if score $song_select sandstone_summit_booth.rhythm.state matches 1 run function sandstone_summit_booth:sections/rhythm/settings/update/if3
execute if score $song_select sandstone_summit_booth.rhythm.state matches 2 run function sandstone_summit_booth:sections/rhythm/settings/update/if4