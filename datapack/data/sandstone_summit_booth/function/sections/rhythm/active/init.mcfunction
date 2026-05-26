scoreboard players set $game sandstone_summit_booth.ssb_state 2
execute in sandstone_summit_booth:rhythm run tp @a[tag=ssb.player] 2 65 0 0 0
gamemode adventure @a[tag=ssb.player]
team join ssb_nocollide @a[tag=ssb.player]
execute as @a[tag=ssb.player] run function sandstone_summit_booth:sections/rhythm/active/init/execute_as
gamerule natural_health_regeneration false
function sandstone_summit_booth:sections/rhythm/active/init/if
function sandstone_summit_booth:sections/rhythm/songs/play
function sandstone_summit_booth:sections/rhythm/songs/schedule_walls
execute as @a[tag=ssb.player] at @s run playsound minecraft:entity.player.levelup master @s