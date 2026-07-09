damage @s 3 freeze
scoreboard players set anon_WnYlBycD_55 __sandstone 3
data modify storage __sandstone:variable anon_WnYlBycD_3 set value {}
execute store result storage __sandstone:variable anon_WnYlBycD_3.param_0 int 1 run scoreboard players get anon_WnYlBycD_55 __sandstone
return run function sandstone_summit_booth:sections/magic/status/freezing/apply with storage __sandstone:variable anon_WnYlBycD_3