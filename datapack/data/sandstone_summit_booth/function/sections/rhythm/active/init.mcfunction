scoreboard players set $status sandstone_summit_booth.rhythm.state 2
execute in minecraft:overworld run tp @a[tag=ssb.rhythm.player] -70 64 43 180 0
execute as @a[tag=ssb.rhythm.player] run function sandstone_summit_booth:sections/rhythm/active/init/execute_as
function sandstone_summit_booth:sections/rhythm/active/init/if
function sandstone_summit_booth:sections/rhythm/lane/spawn
function sandstone_summit_booth:sections/rhythm/lane/border_spawn
function sandstone_summit_booth:sections/rhythm/songs/play
function sandstone_summit_booth:sections/rhythm/songs/schedule_walls
function sandstone_summit_booth:sections/rhythm/settings/update
execute as @a[tag=ssb.rhythm.player] at @s run playsound minecraft:entity.player.levelup master @s