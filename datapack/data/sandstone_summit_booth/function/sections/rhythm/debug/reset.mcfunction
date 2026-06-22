function sandstone_summit_booth:sections/rhythm/songs/stop
function sandstone_summit_booth:sections/rhythm/songs/stop_walls
function sandstone_summit_booth:sections/rhythm/obstacle/clear
function sandstone_summit_booth:sections/rhythm/parkour/cleanup
function sandstone_summit_booth:sections/rhythm/lane/clear
stopsound @a record
execute as @a[tag=ssb.rhythm.player] run function sandstone_summit_booth:sections/rhythm/debug/reset/execute_as
scoreboard players set $status sandstone_summit_booth.rhythm.state 0
scoreboard players set $song_select sandstone_summit_booth.rhythm.state 0
execute in minecraft:overworld run tp @a -118 72 -30
gamemode creative @a