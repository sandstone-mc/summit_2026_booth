scoreboard players set anon_WnYlBycD_5 __sandstone 3
execute if score anon_WnYlBycD_23 __sandstone matches ..0 run advancement grant @a[tag=snd.rhythm.player, scores={sandstone_summit_booth.rhythm.wall.lives=1..}] only summit.sticker_book:sandstone_summit_booth/rhythm
function sandstone_summit_booth:sections/rhythm/songs/stop
function sandstone_summit_booth:sections/rhythm/songs/stop_walls
function sandstone_summit_booth:sections/rhythm/scoring/compute
schedule function sandstone_summit_booth:sections/rhythm/end/cleanup 3s replace