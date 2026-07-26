kill @e[type=minecraft:text_display, tag=sandstone_summit_booth.sections.presentation.menu.start_text]
kill @e[type=minecraft:interaction, tag=sandstone_summit_booth.sections.presentation.menu.start_button]
kill @e[type=minecraft:text_display, tag=sandstone_summit_booth.sections.presentation.menu.next_text]
kill @e[type=minecraft:interaction, tag=sandstone_summit_booth.sections.presentation.menu.next_button]
kill @e[type=minecraft:interaction, tag=sandstone_summit_booth.sections.presentation.menu.credits]
function sandstone_summit_booth:sections/presentation/menu/credits_display/kill
kill @e[type=minecraft:item_display, tag=sandstone_summit_booth.presentation.menu.small_logo]
kill @e[type=minecraft:item_display, tag=sandstone_summit_booth.presentation.menu.screen_saver]
function sandstone_summit_booth:sections/presentation/unmount