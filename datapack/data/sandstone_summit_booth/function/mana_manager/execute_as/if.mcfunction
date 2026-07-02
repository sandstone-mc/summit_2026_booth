execute if score @s sandstone_summit_booth.mana_regen_timer matches ..0 run function sandstone_summit_booth:mana_manager/execute_as/if/if
title @s actionbar ["Mana: ",{"score":{"name":"@s","objective":"sandstone_summit_booth.mana"}}," / ",{"score":{"name":"@s","objective":"sandstone_summit_booth.max_mana"}}]
scoreboard players remove @s sandstone_summit_booth.mana_regen_timer 1