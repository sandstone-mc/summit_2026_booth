function sandstone_summit_booth:sections/magic/playerdb/get_self
execute store result score anon_WnYlBycD_31 __sandstone run data get storage sandstone_summit_booth:io data.current_school_uid
execute store result score anon_WnYlBycD_32 __sandstone run data get storage sandstone_summit_booth:io data.selected_spell_uid
scoreboard players add anon_WnYlBycD_32 __sandstone 1
scoreboard players operation anon_WnYlBycD_71 __sandstone = anon_WnYlBycD_32 __sandstone
scoreboard players operation anon_WnYlBycD_71 __sandstone %= 3 __sandstone
function sandstone_summit_booth:sections/magic/spellbook/cycle_spell/switch
function sandstone_summit_booth:sections/magic/playerdb/save_self