scoreboard players add @s sandstone_summit_booth.mana 1
scoreboard players set anon_WnYlBycD_0 __sandstone 20
scoreboard players operation anon_WnYlBycD_1 __sandstone = anon_WnYlBycD_0 __sandstone
scoreboard players operation anon_WnYlBycD_1 __sandstone /= @s sandstone_summit_booth.mana_regen
scoreboard players operation @s sandstone_summit_booth.mana_regen_timer = anon_WnYlBycD_1 __sandstone