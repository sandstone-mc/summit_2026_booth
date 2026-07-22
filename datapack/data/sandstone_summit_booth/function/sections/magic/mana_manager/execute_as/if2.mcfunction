execute if score @s sandstone_summit_booth.spell_display_timer matches 1.. run return run function sandstone_summit_booth:sections/magic/mana_manager/execute_as/if2/0_if/return_run
scoreboard players operation anon_WnYlBycD_65 __sandstone = #session_timer sandstone_summit_booth.showcase.state
scoreboard players operation anon_WnYlBycD_66 __sandstone = anon_WnYlBycD_65 __sandstone
scoreboard players operation anon_WnYlBycD_66 __sandstone /= 20 __sandstone
scoreboard players operation anon_WnYlBycD_67 __sandstone = anon_WnYlBycD_66 __sandstone
scoreboard players operation anon_WnYlBycD_68 __sandstone = anon_WnYlBycD_67 __sandstone
scoreboard players operation anon_WnYlBycD_68 __sandstone /= 60 __sandstone
scoreboard players operation anon_WnYlBycD_69 __sandstone = anon_WnYlBycD_66 __sandstone
scoreboard players operation anon_WnYlBycD_70 __sandstone = anon_WnYlBycD_69 __sandstone
scoreboard players operation anon_WnYlBycD_70 __sandstone %= 60 __sandstone
function sandstone_summit_booth:sections/magic/mana_manager/execute_as/if2/if