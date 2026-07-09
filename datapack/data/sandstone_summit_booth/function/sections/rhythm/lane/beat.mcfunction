scoreboard players operation $prev sandstone_summit_booth.ssb.glow_pick = $glow sandstone_summit_booth.ssb.glow_pick
execute store result score $glow sandstone_summit_booth.ssb.glow_pick run random value 0..6 sandstone_summit_booth:glow_pick
execute if score $glow sandstone_summit_booth.ssb.glow_pick >= $prev sandstone_summit_booth.ssb.glow_pick run scoreboard players add $glow sandstone_summit_booth.ssb.glow_pick 1
function sandstone_summit_booth:sections/rhythm/lane/beat/if2
particle minecraft:note -70 64.5 43 2.5 0.3 0.3 0 6 normal
function sandstone_summit_booth:sections/rhythm/lane/pulse_up
scoreboard players operation $color sandstone_summit_booth.ssb.border_ripple = $glow sandstone_summit_booth.ssb.glow_pick
function sandstone_summit_booth:sections/rhythm/lane/border_color_set