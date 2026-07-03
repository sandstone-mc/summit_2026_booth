function sandstone_summit_booth:sections/magic/playerdb/get_self
data modify storage __sandstone:variable anon_WnYlBycD_1 set value {}
execute store result storage __sandstone:variable anon_WnYlBycD_1.param_0 int 1 run scoreboard players get @s sandstone_summit_booth.set_spell_trigger
function sandstone_summit_booth:sections/magic/spellbook/set_spell with storage __sandstone:variable anon_WnYlBycD_1
function sandstone_summit_booth:sections/magic/playerdb/save_self
scoreboard players set @s sandstone_summit_booth.set_spell_trigger -1
scoreboard players enable @s sandstone_summit_booth.set_spell_trigger