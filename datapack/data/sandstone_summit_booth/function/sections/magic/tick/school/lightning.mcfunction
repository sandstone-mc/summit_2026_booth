function sandstone_summit_booth:sections/magic/spells/lightning/ball_lightning/update
function sandstone_summit_booth:sections/magic/status/stunned/update
function sandstone_summit_booth:sections/magic/status/charged/update
scoreboard players add magic.tick_counter.lightning_0_WnYlBycD __sandstone 1
scoreboard players operation anon_WnYlBycD_74 __sandstone = magic.tick_counter.lightning_0_WnYlBycD __sandstone
scoreboard players operation anon_WnYlBycD_74 __sandstone %= 10 __sandstone
execute if score anon_WnYlBycD_74 __sandstone matches 0 run function sandstone_summit_booth:sections/magic/spells/lightning/static_field/update
schedule function sandstone_summit_booth:sections/magic/tick/school/lightning 1t replace