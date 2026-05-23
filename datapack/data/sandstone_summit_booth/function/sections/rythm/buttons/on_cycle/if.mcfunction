scoreboard players add $song sandstone_summit_booth.ssb_song 1
execute if score $song sandstone_summit_booth.ssb_song matches 3.. run scoreboard players set $song sandstone_summit_booth.ssb_song 0
function sandstone_summit_booth:sections/rythm/buttons/on_cycle/if/if2
execute at @s run playsound minecraft:ui.button.click master @s