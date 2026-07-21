function sandstone_summit_booth:sections/rhythm/obstacle/clear
function sandstone_summit_booth:sections/rhythm/parkour/cleanup
function sandstone_summit_booth:sections/rhythm/lane/clear
tp @a[tag=ssb.rhythm.player] -70 64 54
execute as @a[tag=ssb.rhythm.player] run function sandstone_summit_booth:sections/rhythm/reset_player
scoreboard players set anon_WnYlBycD_5 __sandstone 0
function sandstone_summit_booth:sections/rhythm/settings/update
function sandstone_summit_booth:sections/main/showcase/session/end