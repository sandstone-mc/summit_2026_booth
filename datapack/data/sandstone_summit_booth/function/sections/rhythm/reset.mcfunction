function sandstone_summit_booth:sections/rhythm/songs/stop_all
function sandstone_summit_booth:sections/rhythm/songs/stop_all_walls
function sandstone_summit_booth:sections/rhythm/obstacle/clear
function sandstone_summit_booth:sections/rhythm/parkour/cleanup
function sandstone_summit_booth:sections/rhythm/lane/clear
stopsound @a[x=-82, y=55, z=26, dx=24, dy=16, dz=32] master
tp @a[tag=snd.rhythm.player] -70 64 54
execute as @a[tag=snd.rhythm.player] run function sandstone_summit_booth:sections/rhythm/reset_player
scoreboard players set anon_WnYlBycD_5 __sandstone 0
scoreboard players set anon_WnYlBycD_6 __sandstone 0