function sandstone_summit_booth:sections/magic/spells/ice/frostbolt/update
function sandstone_summit_booth:sections/magic/status/freezing/update
scoreboard players add magic.tick_counter.ice_0_WnYlBycD __sandstone 1
scoreboard players operation anon_WnYlBycD_73 __sandstone = magic.tick_counter.ice_0_WnYlBycD __sandstone
scoreboard players operation anon_WnYlBycD_73 __sandstone %= 5 __sandstone
execute if score anon_WnYlBycD_73 __sandstone matches 0 run function sandstone_summit_booth:sections/magic/spells/ice/blizzard/update_storms
schedule function sandstone_summit_booth:sections/magic/tick/school/ice 1t replace