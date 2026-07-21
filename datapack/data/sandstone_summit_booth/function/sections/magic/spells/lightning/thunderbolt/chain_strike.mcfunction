particle end_rod ~ ~ ~ 0.1 1 0.1 0 5 force @a[distance=0..24]
particle electric_spark ~ ~1 ~ 0.3 0.5 0.3 0.2 20 force @a[distance=0..24]
damage @s 4 lightning_bolt
scoreboard players set anon_WnYlBycD_77 __sandstone 2
data modify storage __sandstone:variable anon_WnYlBycD_2 set value {}
execute store result storage __sandstone:variable anon_WnYlBycD_2.param_0 int 1 run scoreboard players get anon_WnYlBycD_77 __sandstone
function sandstone_summit_booth:sections/magic/status/stunned/apply with storage __sandstone:variable anon_WnYlBycD_2
scoreboard players set anon_WnYlBycD_78 __sandstone 2
data modify storage __sandstone:variable anon_WnYlBycD_3 set value {}
execute store result storage __sandstone:variable anon_WnYlBycD_3.param_0 int 1 run scoreboard players get anon_WnYlBycD_78 __sandstone
function sandstone_summit_booth:sections/magic/status/charged/apply with storage __sandstone:variable anon_WnYlBycD_3