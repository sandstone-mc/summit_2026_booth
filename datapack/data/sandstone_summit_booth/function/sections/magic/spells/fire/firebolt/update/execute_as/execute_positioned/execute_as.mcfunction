damage @s 2 on_fire
scoreboard players set anon_WnYlBycD_62 __sandstone 2
data modify storage __sandstone:variable anon_WnYlBycD_2 set value {}
execute store result storage __sandstone:variable anon_WnYlBycD_2.param_0 int 1 run scoreboard players get anon_WnYlBycD_62 __sandstone
function sandstone_summit_booth:sections/magic/status/burning/apply with storage __sandstone:variable anon_WnYlBycD_2
execute as @e[tag=sandstone_summit_booth.spell.fire.firebolt.projectile, distance=0..2] run kill @s