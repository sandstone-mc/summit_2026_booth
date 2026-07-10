execute if score @s sandstone_summit_booth.mana < @s sandstone_summit_booth.max_mana run function sandstone_summit_booth:sections/magic/mana_manager/execute_as/if
scoreboard players operation anon_WnYlBycD_49 __sandstone = #session_timer sandstone_summit_booth.showcase.state
scoreboard players operation anon_WnYlBycD_50 __sandstone = anon_WnYlBycD_49 __sandstone
scoreboard players operation anon_WnYlBycD_50 __sandstone /= 20 __sandstone
scoreboard players operation anon_WnYlBycD_51 __sandstone = anon_WnYlBycD_50 __sandstone
scoreboard players operation anon_WnYlBycD_52 __sandstone = anon_WnYlBycD_51 __sandstone
scoreboard players operation anon_WnYlBycD_52 __sandstone /= 60 __sandstone
scoreboard players operation anon_WnYlBycD_53 __sandstone = anon_WnYlBycD_50 __sandstone
scoreboard players operation anon_WnYlBycD_54 __sandstone = anon_WnYlBycD_53 __sandstone
scoreboard players operation anon_WnYlBycD_54 __sandstone %= 60 __sandstone
function sandstone_summit_booth:sections/magic/mana_manager/execute_as/if2