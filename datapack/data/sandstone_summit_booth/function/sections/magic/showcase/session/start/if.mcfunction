function sandstone_summit_booth:sections/main/showcase/session/start
tag @s add sandstone_summit_booth.showcase.player
function sandstone_summit_booth:sections/magic/playerdb/clear_self
function sandstone_summit_booth:sections/magic/playerdb/get_self
data modify storage sandstone_summit_booth:io data merge value {current_school:'fire',selected_spell:'firebolt'}
function sandstone_summit_booth:sections/magic/playerdb/save_self
scoreboard players set @s sandstone_summit_booth.mana 100
scoreboard players set @s sandstone_summit_booth.max_mana 100
scoreboard players set @s sandstone_summit_booth.mana_regen 20
scoreboard players enable @s sandstone_summit_booth.set_school_trigger
scoreboard players enable @s sandstone_summit_booth.set_spell_trigger
return run function sandstone_summit_booth:sections/magic/showcase/intro