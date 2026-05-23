scoreboard players operation @s sandstone_summit_booth.ssb_wmt = @s sandstone_summit_booth.ssb_wage
scoreboard players operation @s sandstone_summit_booth.ssb_wmt *= $num sandstone_summit_booth.ssb_mn
scoreboard players operation @s sandstone_summit_booth.ssb_wmt /= $ticks sandstone_summit_booth.ssb_wtt
scoreboard players set @s sandstone_summit_booth.ssb_wz 30000
scoreboard players operation @s sandstone_summit_booth.ssb_wz -= @s sandstone_summit_booth.ssb_wmt
scoreboard players operation @s sandstone_summit_booth.ssb_wz += @s sandstone_summit_booth.ssb_wdp
execute store result storage ssb:temp pos double 0.001 run scoreboard players get @s sandstone_summit_booth.ssb_wz
function sandstone_summit_booth:sections/rythm/wall/tp with storage ssb:temp