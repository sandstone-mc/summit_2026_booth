function sandstone_summit_booth:sections/rhythm/settings/on_start/if
execute at @s run playsound minecraft:ui.button.click master @s
advancement revoke @s only sandstone_summit_booth:ui_start_game