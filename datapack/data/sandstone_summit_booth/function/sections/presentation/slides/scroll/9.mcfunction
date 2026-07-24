execute store result score #current_time sandstone_summit_booth.presentation.scroll run time query gametime
scoreboard players operation #elapsed sandstone_summit_booth.presentation.scroll = #current_time sandstone_summit_booth.presentation.scroll
scoreboard players operation #elapsed sandstone_summit_booth.presentation.scroll -= #shown_at sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 4
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll = #elapsed sandstone_summit_booth.presentation.scroll
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll /= #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 1
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll < #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 0
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll > #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 0
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 0 run function sandstone_summit_booth:sections/presentation/slides/scroll/9/if
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 1
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 1 run function sandstone_summit_booth:sections/presentation/slides/scroll/9/if2
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 4
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll = #elapsed sandstone_summit_booth.presentation.scroll
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll /= #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 1
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll < #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 0
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll > #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 0
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 0 run function sandstone_summit_booth:sections/presentation/slides/scroll/9/if3
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 1
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 1 run function sandstone_summit_booth:sections/presentation/slides/scroll/9/if4