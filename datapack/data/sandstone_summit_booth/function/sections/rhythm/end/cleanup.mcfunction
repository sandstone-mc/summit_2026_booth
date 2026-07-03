execute in minecraft:overworld run function sandstone_summit_booth:sections/rhythm/end/cleanup/execute_in
function sandstone_summit_booth:sections/rhythm/lane/clear
execute in minecraft:overworld run tp @a[tag=ssb.rhythm.player] -70 64 55
execute as @a[tag=ssb.rhythm.player] run function sandstone_summit_booth:sections/rhythm/end/cleanup/execute_as
team leave @a
gamerule natural_health_regeneration true
gamemode adventure @a
scoreboard players set $status sandstone_summit_booth.rhythm.state 0
function sandstone_summit_booth:sections/rhythm/settings/update