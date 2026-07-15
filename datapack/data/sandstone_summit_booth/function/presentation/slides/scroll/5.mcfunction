execute store result score #current_time sandstone_summit_booth.presentation.scroll run time query gametime
scoreboard players operation #elapsed sandstone_summit_booth.presentation.scroll = #current_time sandstone_summit_booth.presentation.scroll
scoreboard players operation #elapsed sandstone_summit_booth.presentation.scroll -= #shown_at sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 4
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll = #elapsed sandstone_summit_booth.presentation.scroll
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll /= #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 22
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll < #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 0
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll > #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 0
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 0 run function sandstone_summit_booth:presentation/slides/scroll/5/if
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 1
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 1 run function sandstone_summit_booth:presentation/slides/scroll/5/if2
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 2
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 2 run function sandstone_summit_booth:presentation/slides/scroll/5/if3
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 3
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 3 run function sandstone_summit_booth:presentation/slides/scroll/5/if4
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 4
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 4 run function sandstone_summit_booth:presentation/slides/scroll/5/if5
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 5
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 5 run function sandstone_summit_booth:presentation/slides/scroll/5/if6
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 6
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 6 run function sandstone_summit_booth:presentation/slides/scroll/5/if7
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 7
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 7 run function sandstone_summit_booth:presentation/slides/scroll/5/if8
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 8
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 8 run function sandstone_summit_booth:presentation/slides/scroll/5/if9
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 9
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 9 run function sandstone_summit_booth:presentation/slides/scroll/5/if10
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 10
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 10 run function sandstone_summit_booth:presentation/slides/scroll/5/if11
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 11
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 11 run function sandstone_summit_booth:presentation/slides/scroll/5/if12
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 12
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 12 run function sandstone_summit_booth:presentation/slides/scroll/5/if13
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 13
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 13 run function sandstone_summit_booth:presentation/slides/scroll/5/if14
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 14
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 14 run function sandstone_summit_booth:presentation/slides/scroll/5/if15
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 15
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 15 run function sandstone_summit_booth:presentation/slides/scroll/5/if16
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 16
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 16 run function sandstone_summit_booth:presentation/slides/scroll/5/if17
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 17
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 17 run function sandstone_summit_booth:presentation/slides/scroll/5/if18
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 18
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 18 run function sandstone_summit_booth:presentation/slides/scroll/5/if19
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 19
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 19 run function sandstone_summit_booth:presentation/slides/scroll/5/if20
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 20
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 20 run function sandstone_summit_booth:presentation/slides/scroll/5/if21
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 21
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 21 run function sandstone_summit_booth:presentation/slides/scroll/5/if22
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 22
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 22 run function sandstone_summit_booth:presentation/slides/scroll/5/if23