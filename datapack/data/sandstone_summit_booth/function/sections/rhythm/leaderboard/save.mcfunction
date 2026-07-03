execute as @a[tag=ssb.rhythm.player] run function sandstone_summit_booth:sections/rhythm/leaderboard/save/execute_as
scoreboard players operation $lb_song sandstone_summit_booth.rhythm.state = $song_select sandstone_summit_booth.rhythm.state
function sandstone_summit_booth:sections/rhythm/leaderboard/update