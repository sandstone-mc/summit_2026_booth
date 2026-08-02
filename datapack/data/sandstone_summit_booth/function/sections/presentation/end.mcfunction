kill @e[type=minecraft:text_display, tag=sandstone_summit_booth.sections.presentation.menu.next_text]
kill @e[type=minecraft:interaction, tag=sandstone_summit_booth.sections.presentation.menu.next_button]
function sandstone_summit_booth:sections/presentation/menu/spawn_2
scoreboard players enable @a[tag=summit.in_booth.sandstone_summit_booth] ssb.skip_credits
schedule function sandstone_summit_booth:sections/presentation/end/credits_over 300s