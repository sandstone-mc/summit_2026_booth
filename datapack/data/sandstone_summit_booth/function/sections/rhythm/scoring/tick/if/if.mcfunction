scoreboard players set anon_WnYlBycD_10 __sandstone 0
function sandstone_summit_booth:sections/rhythm/lane/beat
execute if score anon_WnYlBycD_11 __sandstone matches 0 as @a[tag=ssb.rhythm.player] at @s run function sandstone_summit_booth:sections/rhythm/scoring/tick/if/if/execute_if