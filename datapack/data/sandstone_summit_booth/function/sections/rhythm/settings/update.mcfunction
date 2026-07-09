scoreboard players set anon_WnYlBycD_38 __sandstone 0
execute if score anon_WnYlBycD_0 __sandstone matches 2.. run return run function sandstone_summit_booth:sections/rhythm/settings/update/0_if/return_run
function sandstone_summit_booth:sections/rhythm/settings/song_line
function sandstone_summit_booth:sections/rhythm/settings/lives_line
function sandstone_summit_booth:sections/rhythm/settings/map_line
function sandstone_summit_booth:sections/rhythm/settings/interp_line
data merge entity @e[tag=ssb.ui.set.cal, limit=1] {text:{text:'  ⧗ CALIBRATE  ',color:'aqua'}}
function sandstone_summit_booth:sections/rhythm/settings/update/if