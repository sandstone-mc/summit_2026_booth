execute store result score anon_WnYlBycD_13 __sandstone run time query gametime
scoreboard players operation anon_WnYlBycD_14 __sandstone = anon_WnYlBycD_13 __sandstone
scoreboard players operation anon_WnYlBycD_14 __sandstone -= anon_WnYlBycD_12 __sandstone
execute if score anon_WnYlBycD_14 __sandstone matches 9.. run scoreboard players remove anon_WnYlBycD_14 __sandstone 16
execute if score anon_WnYlBycD_14 __sandstone matches ..8 run function sandstone_summit_booth:sections/rhythm/calibration/sample/if2