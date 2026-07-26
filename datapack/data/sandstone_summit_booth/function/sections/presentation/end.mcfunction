kill @e[type=minecraft:text_display, tag=sandstone_summit_booth.sections.presentation.menu.next_text]
kill @e[type=minecraft:interaction, tag=sandstone_summit_booth.sections.presentation.menu.next_button]
function sandstone_summit_booth:sections/presentation/menu/spawn_2
schedule function sandstone_summit_booth:sections/presentation/end/schedule 300s