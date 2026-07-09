function sandstone_summit_booth:sections/main/showcase/session/start
scoreboard players set anon_WnYlBycD_0 __sandstone 1
execute store result score anon_WnYlBycD_35 __sandstone run time query gametime
scoreboard players set anon_WnYlBycD_39 __sandstone 0
execute store result score anon_WnYlBycD_39 __sandstone run scoreboard players get @a[tag=ssb.rhythm.player, limit=1] sandstone_summit_booth.rhythm.cal
scoreboard players operation anon_WnYlBycD_39 __sandstone *= 10 __sandstone
scoreboard players set anon_WnYlBycD_34 __sandstone 5
return run function sandstone_summit_booth:sections/rhythm/start/countdown_tick