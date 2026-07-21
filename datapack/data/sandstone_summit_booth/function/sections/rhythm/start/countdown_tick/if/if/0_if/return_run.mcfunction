execute as @a[tag=ssb.rhythm.player] at @s run playsound minecraft:block.note_block.hat master @s
function sandstone_summit_booth:sections/rhythm/start/countdown_tick/if/if/0_if/return_run/if
scoreboard players remove anon_WnYlBycD_47 __sandstone 1
schedule function sandstone_summit_booth:sections/rhythm/start/countdown_tick 1s replace