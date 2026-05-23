scoreboard players set $cont sandstone_summit_booth.ssb_gc 0
execute if score $last sandstone_summit_booth.ssb_lg matches 1.. run function sandstone_summit_booth:sections/rythm/obstacle/spawn_d3/if
execute if score $cont sandstone_summit_booth.ssb_gc matches 0 run function sandstone_summit_booth:sections/rythm/obstacle/spawn_d3/if2