execute if score @s sandstone_summit_booth.mana < @s sandstone_summit_booth.max_mana run function sandstone_summit_booth:mana_manager/execute_as/if
scoreboard players operation anon_WnYlBycD_38 __sandstone = #session_timer sandstone_summit_booth.showcase.state
scoreboard players operation anon_WnYlBycD_39 __sandstone = anon_WnYlBycD_38 __sandstone
scoreboard players operation anon_WnYlBycD_39 __sandstone /= 20 __sandstone
scoreboard players operation anon_WnYlBycD_40 __sandstone = anon_WnYlBycD_39 __sandstone
scoreboard players operation anon_WnYlBycD_41 __sandstone = anon_WnYlBycD_40 __sandstone
scoreboard players operation anon_WnYlBycD_41 __sandstone /= 60 __sandstone
scoreboard players operation anon_WnYlBycD_42 __sandstone = anon_WnYlBycD_39 __sandstone
scoreboard players operation anon_WnYlBycD_43 __sandstone = anon_WnYlBycD_42 __sandstone
scoreboard players operation anon_WnYlBycD_43 __sandstone %= 60 __sandstone
function sandstone_summit_booth:mana_manager/execute_as/if2