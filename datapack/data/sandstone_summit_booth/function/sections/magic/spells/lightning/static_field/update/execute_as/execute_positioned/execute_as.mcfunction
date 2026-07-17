particle electric_spark ~ ~1 ~ 0.2 0.5 0.2 0.1 10 force @a[distance=0..24]
damage @s 1 lightning_bolt
scoreboard players set anon_WnYlBycD_78 __sandstone 1
data modify storage __sandstone:variable anon_WnYlBycD_4 set value {}
execute store result storage __sandstone:variable anon_WnYlBycD_4.param_0 int 1 run scoreboard players get anon_WnYlBycD_78 __sandstone
return run function sandstone_summit_booth:sections/magic/status/stunned/apply with storage __sandstone:variable anon_WnYlBycD_4