scoreboard players set anon_WnYlBycD_5 __sandstone 3
execute if score anon_WnYlBycD_40 __sandstone matches ..0 run advancement grant @a[scores={sandstone_summit_booth.rhythm.wall.lives=1..}, tag=ssb.rhythm.player] only summit.sticker_book:sandstone_summit_booth/rhythm
function sandstone_summit_booth:sections/rhythm/songs/stop
function sandstone_summit_booth:sections/rhythm/songs/stop_walls
function sandstone_summit_booth:sections/rhythm/scoring/compute
function sandstone_summit_booth:sections/rhythm/leaderboard/save
schedule function sandstone_summit_booth:sections/rhythm/end/cleanup 3s replace