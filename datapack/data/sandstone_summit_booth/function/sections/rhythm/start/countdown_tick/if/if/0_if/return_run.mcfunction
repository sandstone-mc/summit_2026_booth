execute as @a[tag=ssb.rhythm.player] at @s run playsound minecraft:block.note_block.hat master @s
function sandstone_summit_booth:sections/rhythm/start/countdown_tick/if/if/0_if/return_run/if
scoreboard players remove $countdown sandstone_summit_booth.rhythm.state 1
schedule function sandstone_summit_booth:sections/rhythm/start/countdown_tick 1s