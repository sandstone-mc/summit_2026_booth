particle electric_spark ~ ~1 ~ 0.3 0.5 0.3 0.1 15 force
damage @s 1 lightning_bolt
scoreboard players set anon_WnYlBycD_58 __sandstone 1
data modify storage __sandstone:variable anon_WnYlBycD_5 set value {}
execute store result storage __sandstone:variable anon_WnYlBycD_5.param_0 int 1 run scoreboard players get anon_WnYlBycD_58 __sandstone
return run function sandstone_summit_booth:sections/magic/status/charged/apply with storage __sandstone:variable anon_WnYlBycD_5