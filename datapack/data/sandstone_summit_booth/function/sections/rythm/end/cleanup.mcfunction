execute in sandstone_summit_booth:rhythm run function sandstone_summit_booth:sections/rythm/end/cleanup/execute_in
execute as @a[tag=ssb.player] run function sandstone_summit_booth:sections/rythm/end/cleanup/execute_as
team leave @a[tag=ssb.player]
gamerule natural_health_regeneration true
execute in minecraft:overworld run tp @a[tag=ssb.player] -118 72 -30
gamemode adventure @a[tag=ssb.player]
scoreboard players set $game sandstone_summit_booth.ssb_state 0