scoreboard players add magic.tick_counter_0_WnYlBycD __sandstone 1
function sandstone_summit_booth:sections/magic/playerdb/tick
function sandstone_summit_booth:sections/magic/mana_manager
function sandstone_summit_booth:sections/magic/spellbook/triggers
execute if score main.showcase.active_0_WnYlBycD __sandstone matches 1 run function sandstone_summit_booth:sections/magic/tick/if
scoreboard players operation anon_WnYlBycD_73 __sandstone = magic.tick_counter_0_WnYlBycD __sandstone
scoreboard players operation anon_WnYlBycD_73 __sandstone %= 5 __sandstone
execute if score anon_WnYlBycD_73 __sandstone matches 0 run function sandstone_summit_booth:sections/magic/spells/ice/blizzard/update_storms
scoreboard players operation anon_WnYlBycD_74 __sandstone = magic.tick_counter_0_WnYlBycD __sandstone
scoreboard players operation anon_WnYlBycD_74 __sandstone %= 10 __sandstone
execute if score anon_WnYlBycD_74 __sandstone matches 0 run function sandstone_summit_booth:sections/magic/spells/lightning/static_field/update
schedule function sandstone_summit_booth:sections/magic/tick 1t replace