scoreboard players set $status sandstone_summit_booth.rhythm.state 2
execute in sandstone_summit_booth:rhythm run tp @a[tag=ssb.rhythm.player] 2 65 0 0 0
gamemode adventure @a[tag=ssb.rhythm.player]
team join ssb.rhythm.nocollide @a[tag=ssb.rhythm.player]
execute as @a[tag=ssb.rhythm.player] run function sandstone_summit_booth:sections/rhythm/active/init/execute_as
gamerule natural_health_regeneration false
function sandstone_summit_booth:sections/rhythm/active/init/if
function sandstone_summit_booth:sections/rhythm/lane/spawn
function sandstone_summit_booth:sections/rhythm/songs/play
function sandstone_summit_booth:sections/rhythm/songs/schedule_walls
execute as @a[tag=ssb.rhythm.player] at @s run playsound minecraft:entity.player.levelup master @s