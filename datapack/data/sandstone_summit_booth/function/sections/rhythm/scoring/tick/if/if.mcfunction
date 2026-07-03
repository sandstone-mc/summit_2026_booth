scoreboard players set $beat_flag sandstone_summit_booth.rhythm.state 0
function sandstone_summit_booth:sections/rhythm/lane/beat
execute in minecraft:overworld as @a[tag=ssb.rhythm.alive, tag=ssb.rhythm.player, tag=!ssb.rhythm.hit_tick] at @s run function sandstone_summit_booth:sections/rhythm/scoring/tick/if/if/execute_in