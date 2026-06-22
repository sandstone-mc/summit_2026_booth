execute in sandstone_summit_booth:rhythm run function sandstone_summit_booth:sections/rhythm/end/cleanup/execute_in
function sandstone_summit_booth:sections/rhythm/lane/clear
execute as @a[tag=ssb.rhythm.player] run function sandstone_summit_booth:sections/rhythm/end/cleanup/execute_as
team leave @a[tag=ssb.rhythm.player]
gamerule natural_health_regeneration true
execute in minecraft:overworld run tp @a[tag=ssb.rhythm.player] -118 72 -30
gamemode adventure @a[tag=ssb.rhythm.player]
scoreboard players set $status sandstone_summit_booth.rhythm.state 0