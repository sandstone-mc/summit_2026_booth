execute if score @s sandstone_summit_booth.spell_display_timer matches 1.. run return run function sandstone_summit_booth:sections/magic/mana_manager/execute_as/if2/0_if/return_run
scoreboard players operation anon_WnYlBycD_58 __sandstone = #session_timer sandstone_summit_booth.showcase.state
scoreboard players operation anon_WnYlBycD_59 __sandstone = anon_WnYlBycD_58 __sandstone
scoreboard players operation anon_WnYlBycD_59 __sandstone /= 20 __sandstone
scoreboard players operation anon_WnYlBycD_60 __sandstone = anon_WnYlBycD_59 __sandstone
scoreboard players operation anon_WnYlBycD_61 __sandstone = anon_WnYlBycD_60 __sandstone
scoreboard players operation anon_WnYlBycD_61 __sandstone /= 60 __sandstone
scoreboard players operation anon_WnYlBycD_62 __sandstone = anon_WnYlBycD_59 __sandstone
scoreboard players operation anon_WnYlBycD_63 __sandstone = anon_WnYlBycD_62 __sandstone
scoreboard players operation anon_WnYlBycD_63 __sandstone %= 60 __sandstone
function sandstone_summit_booth:sections/magic/mana_manager/execute_as/if2/if