scoreboard players operation @s sandstone_summit_booth.pdb.uid = #next sandstone_summit_booth.pdb.uid
scoreboard players add #next sandstone_summit_booth.pdb.uid 1
execute store result storage sandstone_summit_booth:macro uid int 1 run scoreboard players get @s sandstone_summit_booth.pdb.uid
return run function sandstone_summit_booth:sections/magic/playerdb/_init_entry with storage sandstone_summit_booth:macro {}