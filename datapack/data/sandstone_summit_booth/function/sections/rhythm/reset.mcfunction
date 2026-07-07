function sandstone_summit_booth:sections/rhythm/songs/stop_all
function sandstone_summit_booth:sections/rhythm/songs/stop_all_walls
function sandstone_summit_booth:sections/rhythm/obstacle/clear
function sandstone_summit_booth:sections/rhythm/parkour/cleanup
function sandstone_summit_booth:sections/rhythm/lane/clear
stopsound @a[x=-94, y=51, z=11, dx=48, dy=24, dz=64] master
tp @a[tag=ssb.rhythm.player] -70 64 55
execute as @a[tag=ssb.rhythm.player] run function sandstone_summit_booth:sections/rhythm/reset_player
scoreboard players set anon_WnYlBycD_0 __sandstone 0
scoreboard players set anon_WnYlBycD_1 __sandstone 0