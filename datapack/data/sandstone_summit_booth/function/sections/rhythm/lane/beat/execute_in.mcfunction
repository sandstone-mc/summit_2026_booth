scoreboard players operation $prev sandstone_summit_booth.ssb_glp = $glow sandstone_summit_booth.ssb_glp
execute store result score $glow sandstone_summit_booth.ssb_glp run random value 0..6 sandstone_summit_booth:glow_pick
execute if score $glow sandstone_summit_booth.ssb_glp >= $prev sandstone_summit_booth.ssb_glp run scoreboard players add $glow sandstone_summit_booth.ssb_glp 1
function sandstone_summit_booth:sections/rhythm/lane/beat/execute_in/if2
particle minecraft:note 2 65.5 0 2.5 0.3 0.3 0 6 normal