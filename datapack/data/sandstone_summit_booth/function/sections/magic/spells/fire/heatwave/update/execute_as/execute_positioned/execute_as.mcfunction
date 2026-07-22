damage @s 1 on_fire
scoreboard players set anon_WnYlBycD_66 __sandstone 2
data modify storage __sandstone:variable anon_WnYlBycD_0 set value {}
execute store result storage __sandstone:variable anon_WnYlBycD_0.param_0 int 1 run scoreboard players get anon_WnYlBycD_66 __sandstone
return run function sandstone_summit_booth:sections/magic/status/burning/apply with storage __sandstone:variable anon_WnYlBycD_0