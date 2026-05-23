scoreboard players add @s sandstone_summit_booth.ssb_pts 1
scoreboard players add @s sandstone_summit_booth.ssb_cmb 1
scoreboard players operation $mod sandstone_summit_booth.ssb_cmod = @s sandstone_summit_booth.ssb_cmb
scoreboard players operation $mod sandstone_summit_booth.ssb_cmod %= $div sandstone_summit_booth.ssb_cdiv
execute if score $mod sandstone_summit_booth.ssb_cmod matches 0 if score @s sandstone_summit_booth.ssb_cmb matches 1.. run scoreboard players add @s sandstone_summit_booth.ssb_pts 5
function sandstone_summit_booth:sections/rythm/scoring/tick/if/if/execute_in/if2