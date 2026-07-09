scoreboard players set anon_WnYlBycD_78 __sandstone 5
data modify storage __sandstone:variable anon_WnYlBycD_6 set value {}
execute store result storage __sandstone:variable anon_WnYlBycD_6.param_0 int 1 run scoreboard players get anon_WnYlBycD_78 __sandstone
function sandstone_summit_booth:sections/magic/status/entangled/apply with storage __sandstone:variable anon_WnYlBycD_6
particle spore_blossom_air ~ ~1 ~ 0.3 0.5 0.3 0 10 force
particle minecraft:tinted_leaves{color:[0,1,0,1]} ~ ~1 ~ 0.2 0.3 0.2 0.05 8 force