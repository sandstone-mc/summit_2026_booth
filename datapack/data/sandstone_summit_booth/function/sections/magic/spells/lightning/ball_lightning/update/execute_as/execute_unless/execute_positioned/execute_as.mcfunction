damage @s 6 lightning_bolt
scoreboard players set anon_WnYlBycD_21 __sandstone 3
data modify storage __sandstone:variable anon_WnYlBycD_4 set value {}
execute store result storage __sandstone:variable anon_WnYlBycD_4.param_0 int 1 run scoreboard players get anon_WnYlBycD_21 __sandstone
function sandstone_summit_booth:sections/magic/status/stunned/apply with storage __sandstone:variable anon_WnYlBycD_4
scoreboard players set anon_WnYlBycD_22 __sandstone 6
data modify storage __sandstone:variable anon_WnYlBycD_5 set value {}
execute store result storage __sandstone:variable anon_WnYlBycD_5.param_0 int 1 run scoreboard players get anon_WnYlBycD_22 __sandstone
return run function sandstone_summit_booth:sections/magic/status/charged/apply with storage __sandstone:variable anon_WnYlBycD_5