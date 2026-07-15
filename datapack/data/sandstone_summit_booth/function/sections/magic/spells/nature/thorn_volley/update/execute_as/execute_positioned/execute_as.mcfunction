damage @s 2 thorns
scoreboard players set anon_WnYlBycD_77 __sandstone 2
data modify storage __sandstone:variable anon_WnYlBycD_6 set value {}
execute store result storage __sandstone:variable anon_WnYlBycD_6.param_0 int 1 run scoreboard players get anon_WnYlBycD_77 __sandstone
function sandstone_summit_booth:sections/magic/status/entangled/apply with storage __sandstone:variable anon_WnYlBycD_6
particle block{block_state:'minecraft:oak_leaves'} ~ ~ ~ 0.3 0.3 0.3 0.1 10 force @a[distance=0..24]
execute as @e[tag=sandstone_summit_booth.spell.nature.thorn_volley.projectile, distance=0..2] run function sandstone_summit_booth:sections/magic/spells/nature/thorn_volley/update/execute_as/execute_positioned/execute_as/execute_as