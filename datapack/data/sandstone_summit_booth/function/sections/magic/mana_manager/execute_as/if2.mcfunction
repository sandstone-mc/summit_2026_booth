execute if score @s sandstone_summit_booth.spell_display_timer matches 1.. run return run function sandstone_summit_booth:sections/magic/mana_manager/execute_as/if2/0_if/return_run
scoreboard players operation anon_WnYlBycD_42 __sandstone = #session_timer sandstone_summit_booth.showcase.state
scoreboard players operation anon_WnYlBycD_43 __sandstone = anon_WnYlBycD_42 __sandstone
scoreboard players operation anon_WnYlBycD_43 __sandstone /= 20 __sandstone
scoreboard players operation anon_WnYlBycD_44 __sandstone = anon_WnYlBycD_43 __sandstone
scoreboard players operation anon_WnYlBycD_45 __sandstone = anon_WnYlBycD_44 __sandstone
scoreboard players operation anon_WnYlBycD_45 __sandstone /= 60 __sandstone
scoreboard players operation anon_WnYlBycD_46 __sandstone = anon_WnYlBycD_43 __sandstone
scoreboard players operation anon_WnYlBycD_47 __sandstone = anon_WnYlBycD_46 __sandstone
scoreboard players operation anon_WnYlBycD_47 __sandstone %= 60 __sandstone
function sandstone_summit_booth:sections/magic/mana_manager/execute_as/if2/if