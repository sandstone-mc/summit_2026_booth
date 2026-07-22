scoreboard players remove @s sandstone_summit_booth.spell_display_timer 1
execute store result score anon_WnYlBycD_56 __sandstone run data get storage sandstone_summit_booth:io data.current_school_uid
execute store result score anon_WnYlBycD_57 __sandstone run data get storage sandstone_summit_booth:io data.selected_spell_uid
return run function sandstone_summit_booth:sections/magic/mana_manager/switch