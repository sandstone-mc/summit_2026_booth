execute store result score anon_WnYlBycD_10 __sandstone run time query gametime
scoreboard players operation anon_WnYlBycD_11 __sandstone = anon_WnYlBycD_10 __sandstone
scoreboard players operation anon_WnYlBycD_11 __sandstone -= anon_WnYlBycD_9 __sandstone
execute if score anon_WnYlBycD_11 __sandstone matches 9.. run scoreboard players remove anon_WnYlBycD_11 __sandstone 16
execute if score anon_WnYlBycD_11 __sandstone matches ..8 run function sandstone_summit_booth:sections/rhythm/calibration/sample/if2