function sandstone_summit_booth:sections/rythm/songs/stop
function sandstone_summit_booth:sections/rythm/songs/stop_walls
function sandstone_summit_booth:sections/rythm/obstacle/clear
function sandstone_summit_booth:sections/rythm/parkour/cleanup
stopsound @a record
execute as @a[tag=ssb.player] run function sandstone_summit_booth:sections/rythm/debug/reset/execute_as
scoreboard players set $game sandstone_summit_booth.ssb_state 0
scoreboard players set $song sandstone_summit_booth.ssb_song 0
execute in minecraft:overworld run tp @a -118 72 -30
gamemode creative @a