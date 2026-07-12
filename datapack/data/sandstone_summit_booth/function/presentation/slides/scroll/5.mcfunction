execute store result score #current_time sandstone_summit_booth.presentation.scroll run time query gametime
scoreboard players operation #elapsed sandstone_summit_booth.presentation.scroll = #current_time sandstone_summit_booth.presentation.scroll
scoreboard players operation #elapsed sandstone_summit_booth.presentation.scroll -= #shown_at sandstone_summit_booth.presentation.scroll
scoreboard players set #offset sandstone_summit_booth.presentation.scroll #elapsed sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 50
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll < #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 0
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll > #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 5000
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll *= #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #target sandstone_summit_booth.presentation.scroll 782500
scoreboard players operation #target sandstone_summit_booth.presentation.scroll -= #offset sandstone_summit_booth.presentation.scroll
execute as @e[tag=code_scroll_1, tag=sandstone_summit_booth.slide_5] run function sandstone_summit_booth:presentation/slides/scroll/5/execute_as