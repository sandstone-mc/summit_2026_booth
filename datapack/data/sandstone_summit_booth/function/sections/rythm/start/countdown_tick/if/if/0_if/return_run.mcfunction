execute as @a[tag=ssb.player] at @s run playsound minecraft:block.note_block.hat master @s
function sandstone_summit_booth:sections/rythm/start/countdown_tick/if/if/0_if/return_run/if
scoreboard players remove $cd sandstone_summit_booth.ssb_cd 1
schedule function sandstone_summit_booth:sections/rythm/start/countdown_tick 1s