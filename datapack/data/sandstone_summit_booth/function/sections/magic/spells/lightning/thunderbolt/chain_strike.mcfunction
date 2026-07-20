particle end_rod ~ ~ ~ 0.1 1 0.1 0 5 force @a[distance=0..24]
particle electric_spark ~ ~1 ~ 0.3 0.5 0.3 0.2 20 force @a[distance=0..24]
damage @s 4 lightning_bolt
scoreboard players set anon_WnYlBycD_70 __sandstone 2
data modify storage __sandstone:variable anon_WnYlBycD_4 set value {}
execute store result storage __sandstone:variable anon_WnYlBycD_4.param_0 int 1 run scoreboard players get anon_WnYlBycD_70 __sandstone
function sandstone_summit_booth:sections/magic/status/stunned/apply with storage __sandstone:variable anon_WnYlBycD_4
scoreboard players set anon_WnYlBycD_71 __sandstone 2
data modify storage __sandstone:variable anon_WnYlBycD_5 set value {}
execute store result storage __sandstone:variable anon_WnYlBycD_5.param_0 int 1 run scoreboard players get anon_WnYlBycD_71 __sandstone
function sandstone_summit_booth:sections/magic/status/charged/apply with storage __sandstone:variable anon_WnYlBycD_5