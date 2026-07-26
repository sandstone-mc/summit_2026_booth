execute store result score #current_time sandstone_summit_booth.presentation.scroll run time query gametime
scoreboard players operation #elapsed sandstone_summit_booth.presentation.scroll = #current_time sandstone_summit_booth.presentation.scroll
scoreboard players operation #elapsed sandstone_summit_booth.presentation.scroll -= #shown_at sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 4
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll = #elapsed sandstone_summit_booth.presentation.scroll
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll /= #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 55
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll < #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 0
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll > #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 0
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 0 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 1
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 1 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if2
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 2
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 2 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if3
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 3
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 3 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if4
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 4
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 4 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if5
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 5
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 5 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if6
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 6
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 6 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if7
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 7
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 7 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if8
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 8
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 8 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if9
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 9
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 9 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if10
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 10
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 10 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if11
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 11
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 11 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if12
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 12
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 12 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if13
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 13
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 13 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if14
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 14
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 14 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if15
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 15
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 15 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if16
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 16
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 16 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if17
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 17
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 17 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if18
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 18
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 18 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if19
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 19
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 19 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if20
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 20
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 20 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if21
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 21
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 21 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if22
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 22
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 22 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if23
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 23
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 23 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if24
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 24
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 24 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if25
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 25
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 25 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if26
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 26
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 26 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if27
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 27
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 27 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if28
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 28
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 28 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if29
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 29
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 29 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if30
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 30
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 30 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if31
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 31
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 31 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if32
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 32
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 32 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if33
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 33
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 33 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if34
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 34
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 34 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if35
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 35
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 35 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if36
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 36
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 36 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if37
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 37
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 37 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if38
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 38
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 38 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if39
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 39
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 39 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if40
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 40
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 40 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if41
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 41
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 41 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if42
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 42
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 42 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if43
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 43
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 43 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if44
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 44
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 44 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if45
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 45
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 45 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if46
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 46
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 46 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if47
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 47
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 47 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if48
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 48
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 48 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if49
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 49
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 49 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if50
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 50
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 50 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if51
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 51
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 51 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if52
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 52
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 52 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if53
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 53
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 53 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if54
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 54
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 54 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if55
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 55
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 55 run function sandstone_summit_booth:sections/presentation/slides/scroll/17/if56