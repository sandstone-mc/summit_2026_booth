function sandstone_summit_booth:sections/rhythm/songs/stop_all
function sandstone_summit_booth:sections/rhythm/songs/stop_all_walls
function sandstone_summit_booth:sections/rhythm/obstacle/clear
function sandstone_summit_booth:sections/rhythm/parkour/cleanup
function sandstone_summit_booth:sections/rhythm/lane/clear
stopsound @a[tag=summit.in_booth.sandstone_summit_booth, predicate=sandstone_summit_booth:sections/rhythm/booth_listener_range] master
tp @a[tag=snd.rhythm.player] -70 64 54
execute as @a[tag=snd.rhythm.player] run function sandstone_summit_booth:sections/rhythm/reset_player
scoreboard players set anon_WnYlBycD_5 __sandstone 0
scoreboard players set anon_WnYlBycD_6 __sandstone 0