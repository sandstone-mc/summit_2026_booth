scoreboard players set anon_WnYlBycD_7 __sandstone 5
data modify storage __sandstone:variable anon_WnYlBycD_5 set value {}
execute store result storage __sandstone:variable anon_WnYlBycD_5.param_0 int 1 run scoreboard players get anon_WnYlBycD_7 __sandstone
function sandstone_summit_booth:sections/magic/status/charged/apply with storage __sandstone:variable anon_WnYlBycD_5