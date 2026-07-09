schedule clear sandstone_summit_booth:sections/rhythm/settings/scroll_loop
data merge entity @e[tag=ssb.ui.set.song, limit=1] {text:{text:' '}}
function sandstone_summit_booth:sections/rhythm/settings/update/0_if/return_run/if
data merge entity @e[tag=ssb.ui.set.map, limit=1] {text:{text:' '}}
data merge entity @e[tag=ssb.ui.set.interp, limit=1] {text:{text:' '}}
data merge entity @e[tag=ssb.ui.set.cal, limit=1] {text:{text:' '}}
data merge entity @e[tag=ssb.ui.set.btn, limit=1] {text:{text:' '}}