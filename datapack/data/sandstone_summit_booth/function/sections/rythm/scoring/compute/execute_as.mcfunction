scoreboard players operation @s sandstone_summit_booth.ssb_tc = @s sandstone_summit_booth.ssb_cmb
scoreboard players operation @s sandstone_summit_booth.ssb_tc < $max sandstone_summit_booth.ssb_mc
scoreboard players add @s sandstone_summit_booth.ssb_tc 50
scoreboard players operation @s sandstone_summit_booth.ssb_scr = @s sandstone_summit_booth.ssb_pts
scoreboard players operation @s sandstone_summit_booth.ssb_scr *= @s sandstone_summit_booth.ssb_tc
scoreboard players operation @s sandstone_summit_booth.ssb_scr /= $max sandstone_summit_booth.ssb_mc