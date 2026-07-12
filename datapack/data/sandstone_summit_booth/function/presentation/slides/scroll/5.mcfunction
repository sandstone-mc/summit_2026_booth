execute store result score #current_time sandstone_summit_booth.presentation.scroll run time query gametime
scoreboard players operation #elapsed sandstone_summit_booth.presentation.scroll = #current_time sandstone_summit_booth.presentation.scroll
scoreboard players operation #elapsed sandstone_summit_booth.presentation.scroll -= #shown_at sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 4
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll = #elapsed sandstone_summit_booth.presentation.scroll
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll /= #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 50
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll < #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 0
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll > #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 0
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 0 run function sandstone_summit_booth:presentation/slides/scroll/5/if
execute if score #limit sandstone_summit_booth.presentation.scroll matches 0 run function sandstone_summit_booth:presentation/slides/scroll/5/if2
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 1
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 1 run function sandstone_summit_booth:presentation/slides/scroll/5/if3
execute if score #limit sandstone_summit_booth.presentation.scroll matches 1 run function sandstone_summit_booth:presentation/slides/scroll/5/if4
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 2
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 2 run function sandstone_summit_booth:presentation/slides/scroll/5/if5
execute if score #limit sandstone_summit_booth.presentation.scroll matches 2 run function sandstone_summit_booth:presentation/slides/scroll/5/if6
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 3
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 3 run function sandstone_summit_booth:presentation/slides/scroll/5/if7
execute if score #limit sandstone_summit_booth.presentation.scroll matches 3 run function sandstone_summit_booth:presentation/slides/scroll/5/if8
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 4
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 4 run function sandstone_summit_booth:presentation/slides/scroll/5/if9
execute if score #limit sandstone_summit_booth.presentation.scroll matches 4 run function sandstone_summit_booth:presentation/slides/scroll/5/if10
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 5
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 5 run function sandstone_summit_booth:presentation/slides/scroll/5/if11
execute if score #limit sandstone_summit_booth.presentation.scroll matches 5 run function sandstone_summit_booth:presentation/slides/scroll/5/if12
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 6
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 6 run function sandstone_summit_booth:presentation/slides/scroll/5/if13
execute if score #limit sandstone_summit_booth.presentation.scroll matches 6 run function sandstone_summit_booth:presentation/slides/scroll/5/if14
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 7
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 7 run function sandstone_summit_booth:presentation/slides/scroll/5/if15
execute if score #limit sandstone_summit_booth.presentation.scroll matches 7 run function sandstone_summit_booth:presentation/slides/scroll/5/if16
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 8
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 8 run function sandstone_summit_booth:presentation/slides/scroll/5/if17
execute if score #limit sandstone_summit_booth.presentation.scroll matches 8 run function sandstone_summit_booth:presentation/slides/scroll/5/if18
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 9
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 9 run function sandstone_summit_booth:presentation/slides/scroll/5/if19
execute if score #limit sandstone_summit_booth.presentation.scroll matches 9 run function sandstone_summit_booth:presentation/slides/scroll/5/if20
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 10
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 10 run function sandstone_summit_booth:presentation/slides/scroll/5/if21
execute if score #limit sandstone_summit_booth.presentation.scroll matches 10 run function sandstone_summit_booth:presentation/slides/scroll/5/if22
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 11
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 11 run function sandstone_summit_booth:presentation/slides/scroll/5/if23
execute if score #limit sandstone_summit_booth.presentation.scroll matches 11 run function sandstone_summit_booth:presentation/slides/scroll/5/if24
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 12
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 12 run function sandstone_summit_booth:presentation/slides/scroll/5/if25
execute if score #limit sandstone_summit_booth.presentation.scroll matches 12 run function sandstone_summit_booth:presentation/slides/scroll/5/if26
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 13
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 13 run function sandstone_summit_booth:presentation/slides/scroll/5/if27
execute if score #limit sandstone_summit_booth.presentation.scroll matches 13 run function sandstone_summit_booth:presentation/slides/scroll/5/if28
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 14
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 14 run function sandstone_summit_booth:presentation/slides/scroll/5/if29
execute if score #limit sandstone_summit_booth.presentation.scroll matches 14 run function sandstone_summit_booth:presentation/slides/scroll/5/if30
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 15
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 15 run function sandstone_summit_booth:presentation/slides/scroll/5/if31
execute if score #limit sandstone_summit_booth.presentation.scroll matches 15 run function sandstone_summit_booth:presentation/slides/scroll/5/if32
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 16
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 16 run function sandstone_summit_booth:presentation/slides/scroll/5/if33
execute if score #limit sandstone_summit_booth.presentation.scroll matches 16 run function sandstone_summit_booth:presentation/slides/scroll/5/if34
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 17
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 17 run function sandstone_summit_booth:presentation/slides/scroll/5/if35
execute if score #limit sandstone_summit_booth.presentation.scroll matches 17 run function sandstone_summit_booth:presentation/slides/scroll/5/if36
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 18
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 18 run function sandstone_summit_booth:presentation/slides/scroll/5/if37
execute if score #limit sandstone_summit_booth.presentation.scroll matches 18 run function sandstone_summit_booth:presentation/slides/scroll/5/if38
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 19
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 19 run function sandstone_summit_booth:presentation/slides/scroll/5/if39
execute if score #limit sandstone_summit_booth.presentation.scroll matches 19 run function sandstone_summit_booth:presentation/slides/scroll/5/if40
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 20
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 20 run function sandstone_summit_booth:presentation/slides/scroll/5/if41
execute if score #limit sandstone_summit_booth.presentation.scroll matches 20 run function sandstone_summit_booth:presentation/slides/scroll/5/if42
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 21
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 21 run function sandstone_summit_booth:presentation/slides/scroll/5/if43
execute if score #limit sandstone_summit_booth.presentation.scroll matches 21 run function sandstone_summit_booth:presentation/slides/scroll/5/if44
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 22
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 22 run function sandstone_summit_booth:presentation/slides/scroll/5/if45
execute if score #limit sandstone_summit_booth.presentation.scroll matches 22 run function sandstone_summit_booth:presentation/slides/scroll/5/if46
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 23
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 23 run function sandstone_summit_booth:presentation/slides/scroll/5/if47
execute if score #limit sandstone_summit_booth.presentation.scroll matches 23 run function sandstone_summit_booth:presentation/slides/scroll/5/if48
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 24
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 24 run function sandstone_summit_booth:presentation/slides/scroll/5/if49
execute if score #limit sandstone_summit_booth.presentation.scroll matches 24 run function sandstone_summit_booth:presentation/slides/scroll/5/if50
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 25
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 25 run function sandstone_summit_booth:presentation/slides/scroll/5/if51
execute if score #limit sandstone_summit_booth.presentation.scroll matches 25 run function sandstone_summit_booth:presentation/slides/scroll/5/if52
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 26
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 26 run function sandstone_summit_booth:presentation/slides/scroll/5/if53
execute if score #limit sandstone_summit_booth.presentation.scroll matches 26 run function sandstone_summit_booth:presentation/slides/scroll/5/if54
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 27
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 27 run function sandstone_summit_booth:presentation/slides/scroll/5/if55
execute if score #limit sandstone_summit_booth.presentation.scroll matches 27 run function sandstone_summit_booth:presentation/slides/scroll/5/if56
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 28
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 28 run function sandstone_summit_booth:presentation/slides/scroll/5/if57
execute if score #limit sandstone_summit_booth.presentation.scroll matches 28 run function sandstone_summit_booth:presentation/slides/scroll/5/if58
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 29
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 29 run function sandstone_summit_booth:presentation/slides/scroll/5/if59
execute if score #limit sandstone_summit_booth.presentation.scroll matches 29 run function sandstone_summit_booth:presentation/slides/scroll/5/if60
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 30
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 30 run function sandstone_summit_booth:presentation/slides/scroll/5/if61
execute if score #limit sandstone_summit_booth.presentation.scroll matches 30 run function sandstone_summit_booth:presentation/slides/scroll/5/if62
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 31
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 31 run function sandstone_summit_booth:presentation/slides/scroll/5/if63
execute if score #limit sandstone_summit_booth.presentation.scroll matches 31 run function sandstone_summit_booth:presentation/slides/scroll/5/if64
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 32
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 32 run function sandstone_summit_booth:presentation/slides/scroll/5/if65
execute if score #limit sandstone_summit_booth.presentation.scroll matches 32 run function sandstone_summit_booth:presentation/slides/scroll/5/if66
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 33
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 33 run function sandstone_summit_booth:presentation/slides/scroll/5/if67
execute if score #limit sandstone_summit_booth.presentation.scroll matches 33 run function sandstone_summit_booth:presentation/slides/scroll/5/if68
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 34
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 34 run function sandstone_summit_booth:presentation/slides/scroll/5/if69
execute if score #limit sandstone_summit_booth.presentation.scroll matches 34 run function sandstone_summit_booth:presentation/slides/scroll/5/if70
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 35
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 35 run function sandstone_summit_booth:presentation/slides/scroll/5/if71
execute if score #limit sandstone_summit_booth.presentation.scroll matches 35 run function sandstone_summit_booth:presentation/slides/scroll/5/if72
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 36
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 36 run function sandstone_summit_booth:presentation/slides/scroll/5/if73
execute if score #limit sandstone_summit_booth.presentation.scroll matches 36 run function sandstone_summit_booth:presentation/slides/scroll/5/if74
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 37
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 37 run function sandstone_summit_booth:presentation/slides/scroll/5/if75
execute if score #limit sandstone_summit_booth.presentation.scroll matches 37 run function sandstone_summit_booth:presentation/slides/scroll/5/if76
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 38
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 38 run function sandstone_summit_booth:presentation/slides/scroll/5/if77
execute if score #limit sandstone_summit_booth.presentation.scroll matches 38 run function sandstone_summit_booth:presentation/slides/scroll/5/if78
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 39
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 39 run function sandstone_summit_booth:presentation/slides/scroll/5/if79
execute if score #limit sandstone_summit_booth.presentation.scroll matches 39 run function sandstone_summit_booth:presentation/slides/scroll/5/if80
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 40
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 40 run function sandstone_summit_booth:presentation/slides/scroll/5/if81
execute if score #limit sandstone_summit_booth.presentation.scroll matches 40 run function sandstone_summit_booth:presentation/slides/scroll/5/if82
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 41
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 41 run function sandstone_summit_booth:presentation/slides/scroll/5/if83
execute if score #limit sandstone_summit_booth.presentation.scroll matches 41 run function sandstone_summit_booth:presentation/slides/scroll/5/if84
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 42
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 42 run function sandstone_summit_booth:presentation/slides/scroll/5/if85
execute if score #limit sandstone_summit_booth.presentation.scroll matches 42 run function sandstone_summit_booth:presentation/slides/scroll/5/if86
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 43
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 43 run function sandstone_summit_booth:presentation/slides/scroll/5/if87
execute if score #limit sandstone_summit_booth.presentation.scroll matches 43 run function sandstone_summit_booth:presentation/slides/scroll/5/if88
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 44
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 44 run function sandstone_summit_booth:presentation/slides/scroll/5/if89
execute if score #limit sandstone_summit_booth.presentation.scroll matches 44 run function sandstone_summit_booth:presentation/slides/scroll/5/if90
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 45
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 45 run function sandstone_summit_booth:presentation/slides/scroll/5/if91
execute if score #limit sandstone_summit_booth.presentation.scroll matches 45 run function sandstone_summit_booth:presentation/slides/scroll/5/if92
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 46
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 46 run function sandstone_summit_booth:presentation/slides/scroll/5/if93
execute if score #limit sandstone_summit_booth.presentation.scroll matches 46 run function sandstone_summit_booth:presentation/slides/scroll/5/if94
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 47
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 47 run function sandstone_summit_booth:presentation/slides/scroll/5/if95
execute if score #limit sandstone_summit_booth.presentation.scroll matches 47 run function sandstone_summit_booth:presentation/slides/scroll/5/if96
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 48
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 48 run function sandstone_summit_booth:presentation/slides/scroll/5/if97
execute if score #limit sandstone_summit_booth.presentation.scroll matches 48 run function sandstone_summit_booth:presentation/slides/scroll/5/if98
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 49
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 49 run function sandstone_summit_booth:presentation/slides/scroll/5/if99
execute if score #limit sandstone_summit_booth.presentation.scroll matches 49 run function sandstone_summit_booth:presentation/slides/scroll/5/if100
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 50
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 50 run function sandstone_summit_booth:presentation/slides/scroll/5/if101
execute if score #limit sandstone_summit_booth.presentation.scroll matches 50 run function sandstone_summit_booth:presentation/slides/scroll/5/if102