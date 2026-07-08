damage @s 1 freeze
scoreboard players set anon_WnYlBycD_47 __sandstone 2
data modify storage __sandstone:variable anon_WnYlBycD_3 set value {}
execute store result storage __sandstone:variable anon_WnYlBycD_3.param_0 int 1 run scoreboard players get anon_WnYlBycD_47 __sandstone
function sandstone_summit_booth:sections/magic/status/freezing/apply with storage __sandstone:variable anon_WnYlBycD_3
execute as @e[tag=sandstone_summit_booth.spell.ice.frostbolt.projectile, distance=0..2] run kill @s