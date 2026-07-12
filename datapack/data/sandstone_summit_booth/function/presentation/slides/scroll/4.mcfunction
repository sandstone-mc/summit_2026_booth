execute store result score #current_time sandstone_summit_booth.presentation.scroll run time query gametime
scoreboard players operation #elapsed sandstone_summit_booth.presentation.scroll = #current_time sandstone_summit_booth.presentation.scroll
scoreboard players operation #elapsed sandstone_summit_booth.presentation.scroll -= #shown_at sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 4
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll = #elapsed sandstone_summit_booth.presentation.scroll
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll /= #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 256
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll < #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 0
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll > #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 0
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 0 run function sandstone_summit_booth:presentation/slides/scroll/4/if
execute if score #limit sandstone_summit_booth.presentation.scroll matches 0 run function sandstone_summit_booth:presentation/slides/scroll/4/if2
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 1
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 1 run function sandstone_summit_booth:presentation/slides/scroll/4/if3
execute if score #limit sandstone_summit_booth.presentation.scroll matches 1 run function sandstone_summit_booth:presentation/slides/scroll/4/if4
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 2
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 2 run function sandstone_summit_booth:presentation/slides/scroll/4/if5
execute if score #limit sandstone_summit_booth.presentation.scroll matches 2 run function sandstone_summit_booth:presentation/slides/scroll/4/if6
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 3
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 3 run function sandstone_summit_booth:presentation/slides/scroll/4/if7
execute if score #limit sandstone_summit_booth.presentation.scroll matches 3 run function sandstone_summit_booth:presentation/slides/scroll/4/if8
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 4
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 4 run function sandstone_summit_booth:presentation/slides/scroll/4/if9
execute if score #limit sandstone_summit_booth.presentation.scroll matches 4 run function sandstone_summit_booth:presentation/slides/scroll/4/if10
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 5
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 5 run function sandstone_summit_booth:presentation/slides/scroll/4/if11
execute if score #limit sandstone_summit_booth.presentation.scroll matches 5 run function sandstone_summit_booth:presentation/slides/scroll/4/if12
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 6
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 6 run function sandstone_summit_booth:presentation/slides/scroll/4/if13
execute if score #limit sandstone_summit_booth.presentation.scroll matches 6 run function sandstone_summit_booth:presentation/slides/scroll/4/if14
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 7
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 7 run function sandstone_summit_booth:presentation/slides/scroll/4/if15
execute if score #limit sandstone_summit_booth.presentation.scroll matches 7 run function sandstone_summit_booth:presentation/slides/scroll/4/if16
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 8
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 8 run function sandstone_summit_booth:presentation/slides/scroll/4/if17
execute if score #limit sandstone_summit_booth.presentation.scroll matches 8 run function sandstone_summit_booth:presentation/slides/scroll/4/if18
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 9
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 9 run function sandstone_summit_booth:presentation/slides/scroll/4/if19
execute if score #limit sandstone_summit_booth.presentation.scroll matches 9 run function sandstone_summit_booth:presentation/slides/scroll/4/if20
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 10
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 10 run function sandstone_summit_booth:presentation/slides/scroll/4/if21
execute if score #limit sandstone_summit_booth.presentation.scroll matches 10 run function sandstone_summit_booth:presentation/slides/scroll/4/if22
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 11
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 11 run function sandstone_summit_booth:presentation/slides/scroll/4/if23
execute if score #limit sandstone_summit_booth.presentation.scroll matches 11 run function sandstone_summit_booth:presentation/slides/scroll/4/if24
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 12
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 12 run function sandstone_summit_booth:presentation/slides/scroll/4/if25
execute if score #limit sandstone_summit_booth.presentation.scroll matches 12 run function sandstone_summit_booth:presentation/slides/scroll/4/if26
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 13
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 13 run function sandstone_summit_booth:presentation/slides/scroll/4/if27
execute if score #limit sandstone_summit_booth.presentation.scroll matches 13 run function sandstone_summit_booth:presentation/slides/scroll/4/if28
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 14
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 14 run function sandstone_summit_booth:presentation/slides/scroll/4/if29
execute if score #limit sandstone_summit_booth.presentation.scroll matches 14 run function sandstone_summit_booth:presentation/slides/scroll/4/if30
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 15
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 15 run function sandstone_summit_booth:presentation/slides/scroll/4/if31
execute if score #limit sandstone_summit_booth.presentation.scroll matches 15 run function sandstone_summit_booth:presentation/slides/scroll/4/if32
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 16
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 16 run function sandstone_summit_booth:presentation/slides/scroll/4/if33
execute if score #limit sandstone_summit_booth.presentation.scroll matches 16 run function sandstone_summit_booth:presentation/slides/scroll/4/if34
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 17
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 17 run function sandstone_summit_booth:presentation/slides/scroll/4/if35
execute if score #limit sandstone_summit_booth.presentation.scroll matches 17 run function sandstone_summit_booth:presentation/slides/scroll/4/if36
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 18
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 18 run function sandstone_summit_booth:presentation/slides/scroll/4/if37
execute if score #limit sandstone_summit_booth.presentation.scroll matches 18 run function sandstone_summit_booth:presentation/slides/scroll/4/if38
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 19
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 19 run function sandstone_summit_booth:presentation/slides/scroll/4/if39
execute if score #limit sandstone_summit_booth.presentation.scroll matches 19 run function sandstone_summit_booth:presentation/slides/scroll/4/if40
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 20
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 20 run function sandstone_summit_booth:presentation/slides/scroll/4/if41
execute if score #limit sandstone_summit_booth.presentation.scroll matches 20 run function sandstone_summit_booth:presentation/slides/scroll/4/if42
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 21
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 21 run function sandstone_summit_booth:presentation/slides/scroll/4/if43
execute if score #limit sandstone_summit_booth.presentation.scroll matches 21 run function sandstone_summit_booth:presentation/slides/scroll/4/if44
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 22
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 22 run function sandstone_summit_booth:presentation/slides/scroll/4/if45
execute if score #limit sandstone_summit_booth.presentation.scroll matches 22 run function sandstone_summit_booth:presentation/slides/scroll/4/if46
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 23
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 23 run function sandstone_summit_booth:presentation/slides/scroll/4/if47
execute if score #limit sandstone_summit_booth.presentation.scroll matches 23 run function sandstone_summit_booth:presentation/slides/scroll/4/if48
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 24
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 24 run function sandstone_summit_booth:presentation/slides/scroll/4/if49
execute if score #limit sandstone_summit_booth.presentation.scroll matches 24 run function sandstone_summit_booth:presentation/slides/scroll/4/if50
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 25
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 25 run function sandstone_summit_booth:presentation/slides/scroll/4/if51
execute if score #limit sandstone_summit_booth.presentation.scroll matches 25 run function sandstone_summit_booth:presentation/slides/scroll/4/if52
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 26
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 26 run function sandstone_summit_booth:presentation/slides/scroll/4/if53
execute if score #limit sandstone_summit_booth.presentation.scroll matches 26 run function sandstone_summit_booth:presentation/slides/scroll/4/if54
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 27
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 27 run function sandstone_summit_booth:presentation/slides/scroll/4/if55
execute if score #limit sandstone_summit_booth.presentation.scroll matches 27 run function sandstone_summit_booth:presentation/slides/scroll/4/if56
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 28
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 28 run function sandstone_summit_booth:presentation/slides/scroll/4/if57
execute if score #limit sandstone_summit_booth.presentation.scroll matches 28 run function sandstone_summit_booth:presentation/slides/scroll/4/if58
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 29
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 29 run function sandstone_summit_booth:presentation/slides/scroll/4/if59
execute if score #limit sandstone_summit_booth.presentation.scroll matches 29 run function sandstone_summit_booth:presentation/slides/scroll/4/if60
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 30
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 30 run function sandstone_summit_booth:presentation/slides/scroll/4/if61
execute if score #limit sandstone_summit_booth.presentation.scroll matches 30 run function sandstone_summit_booth:presentation/slides/scroll/4/if62
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 31
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 31 run function sandstone_summit_booth:presentation/slides/scroll/4/if63
execute if score #limit sandstone_summit_booth.presentation.scroll matches 31 run function sandstone_summit_booth:presentation/slides/scroll/4/if64
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 32
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 32 run function sandstone_summit_booth:presentation/slides/scroll/4/if65
execute if score #limit sandstone_summit_booth.presentation.scroll matches 32 run function sandstone_summit_booth:presentation/slides/scroll/4/if66
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 33
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 33 run function sandstone_summit_booth:presentation/slides/scroll/4/if67
execute if score #limit sandstone_summit_booth.presentation.scroll matches 33 run function sandstone_summit_booth:presentation/slides/scroll/4/if68
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 34
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 34 run function sandstone_summit_booth:presentation/slides/scroll/4/if69
execute if score #limit sandstone_summit_booth.presentation.scroll matches 34 run function sandstone_summit_booth:presentation/slides/scroll/4/if70
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 35
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 35 run function sandstone_summit_booth:presentation/slides/scroll/4/if71
execute if score #limit sandstone_summit_booth.presentation.scroll matches 35 run function sandstone_summit_booth:presentation/slides/scroll/4/if72
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 36
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 36 run function sandstone_summit_booth:presentation/slides/scroll/4/if73
execute if score #limit sandstone_summit_booth.presentation.scroll matches 36 run function sandstone_summit_booth:presentation/slides/scroll/4/if74
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 37
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 37 run function sandstone_summit_booth:presentation/slides/scroll/4/if75
execute if score #limit sandstone_summit_booth.presentation.scroll matches 37 run function sandstone_summit_booth:presentation/slides/scroll/4/if76
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 38
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 38 run function sandstone_summit_booth:presentation/slides/scroll/4/if77
execute if score #limit sandstone_summit_booth.presentation.scroll matches 38 run function sandstone_summit_booth:presentation/slides/scroll/4/if78
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 39
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 39 run function sandstone_summit_booth:presentation/slides/scroll/4/if79
execute if score #limit sandstone_summit_booth.presentation.scroll matches 39 run function sandstone_summit_booth:presentation/slides/scroll/4/if80
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 40
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 40 run function sandstone_summit_booth:presentation/slides/scroll/4/if81
execute if score #limit sandstone_summit_booth.presentation.scroll matches 40 run function sandstone_summit_booth:presentation/slides/scroll/4/if82
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 41
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 41 run function sandstone_summit_booth:presentation/slides/scroll/4/if83
execute if score #limit sandstone_summit_booth.presentation.scroll matches 41 run function sandstone_summit_booth:presentation/slides/scroll/4/if84
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 42
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 42 run function sandstone_summit_booth:presentation/slides/scroll/4/if85
execute if score #limit sandstone_summit_booth.presentation.scroll matches 42 run function sandstone_summit_booth:presentation/slides/scroll/4/if86
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 43
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 43 run function sandstone_summit_booth:presentation/slides/scroll/4/if87
execute if score #limit sandstone_summit_booth.presentation.scroll matches 43 run function sandstone_summit_booth:presentation/slides/scroll/4/if88
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 44
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 44 run function sandstone_summit_booth:presentation/slides/scroll/4/if89
execute if score #limit sandstone_summit_booth.presentation.scroll matches 44 run function sandstone_summit_booth:presentation/slides/scroll/4/if90
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 45
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 45 run function sandstone_summit_booth:presentation/slides/scroll/4/if91
execute if score #limit sandstone_summit_booth.presentation.scroll matches 45 run function sandstone_summit_booth:presentation/slides/scroll/4/if92
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 46
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 46 run function sandstone_summit_booth:presentation/slides/scroll/4/if93
execute if score #limit sandstone_summit_booth.presentation.scroll matches 46 run function sandstone_summit_booth:presentation/slides/scroll/4/if94
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 47
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 47 run function sandstone_summit_booth:presentation/slides/scroll/4/if95
execute if score #limit sandstone_summit_booth.presentation.scroll matches 47 run function sandstone_summit_booth:presentation/slides/scroll/4/if96
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 48
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 48 run function sandstone_summit_booth:presentation/slides/scroll/4/if97
execute if score #limit sandstone_summit_booth.presentation.scroll matches 48 run function sandstone_summit_booth:presentation/slides/scroll/4/if98
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 49
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 49 run function sandstone_summit_booth:presentation/slides/scroll/4/if99
execute if score #limit sandstone_summit_booth.presentation.scroll matches 49 run function sandstone_summit_booth:presentation/slides/scroll/4/if100
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 50
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 50 run function sandstone_summit_booth:presentation/slides/scroll/4/if101
execute if score #limit sandstone_summit_booth.presentation.scroll matches 50 run function sandstone_summit_booth:presentation/slides/scroll/4/if102
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 51
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 51 run function sandstone_summit_booth:presentation/slides/scroll/4/if103
execute if score #limit sandstone_summit_booth.presentation.scroll matches 51 run function sandstone_summit_booth:presentation/slides/scroll/4/if104
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 52
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 52 run function sandstone_summit_booth:presentation/slides/scroll/4/if105
execute if score #limit sandstone_summit_booth.presentation.scroll matches 52 run function sandstone_summit_booth:presentation/slides/scroll/4/if106
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 53
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 53 run function sandstone_summit_booth:presentation/slides/scroll/4/if107
execute if score #limit sandstone_summit_booth.presentation.scroll matches 53 run function sandstone_summit_booth:presentation/slides/scroll/4/if108
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 54
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 54 run function sandstone_summit_booth:presentation/slides/scroll/4/if109
execute if score #limit sandstone_summit_booth.presentation.scroll matches 54 run function sandstone_summit_booth:presentation/slides/scroll/4/if110
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 55
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 55 run function sandstone_summit_booth:presentation/slides/scroll/4/if111
execute if score #limit sandstone_summit_booth.presentation.scroll matches 55 run function sandstone_summit_booth:presentation/slides/scroll/4/if112
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 56
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 56 run function sandstone_summit_booth:presentation/slides/scroll/4/if113
execute if score #limit sandstone_summit_booth.presentation.scroll matches 56 run function sandstone_summit_booth:presentation/slides/scroll/4/if114
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 57
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 57 run function sandstone_summit_booth:presentation/slides/scroll/4/if115
execute if score #limit sandstone_summit_booth.presentation.scroll matches 57 run function sandstone_summit_booth:presentation/slides/scroll/4/if116
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 58
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 58 run function sandstone_summit_booth:presentation/slides/scroll/4/if117
execute if score #limit sandstone_summit_booth.presentation.scroll matches 58 run function sandstone_summit_booth:presentation/slides/scroll/4/if118
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 59
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 59 run function sandstone_summit_booth:presentation/slides/scroll/4/if119
execute if score #limit sandstone_summit_booth.presentation.scroll matches 59 run function sandstone_summit_booth:presentation/slides/scroll/4/if120
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 60
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 60 run function sandstone_summit_booth:presentation/slides/scroll/4/if121
execute if score #limit sandstone_summit_booth.presentation.scroll matches 60 run function sandstone_summit_booth:presentation/slides/scroll/4/if122
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 61
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 61 run function sandstone_summit_booth:presentation/slides/scroll/4/if123
execute if score #limit sandstone_summit_booth.presentation.scroll matches 61 run function sandstone_summit_booth:presentation/slides/scroll/4/if124
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 62
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 62 run function sandstone_summit_booth:presentation/slides/scroll/4/if125
execute if score #limit sandstone_summit_booth.presentation.scroll matches 62 run function sandstone_summit_booth:presentation/slides/scroll/4/if126
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 63
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 63 run function sandstone_summit_booth:presentation/slides/scroll/4/if127
execute if score #limit sandstone_summit_booth.presentation.scroll matches 63 run function sandstone_summit_booth:presentation/slides/scroll/4/if128
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 64
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 64 run function sandstone_summit_booth:presentation/slides/scroll/4/if129
execute if score #limit sandstone_summit_booth.presentation.scroll matches 64 run function sandstone_summit_booth:presentation/slides/scroll/4/if130
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 65
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 65 run function sandstone_summit_booth:presentation/slides/scroll/4/if131
execute if score #limit sandstone_summit_booth.presentation.scroll matches 65 run function sandstone_summit_booth:presentation/slides/scroll/4/if132
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 66
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 66 run function sandstone_summit_booth:presentation/slides/scroll/4/if133
execute if score #limit sandstone_summit_booth.presentation.scroll matches 66 run function sandstone_summit_booth:presentation/slides/scroll/4/if134
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 67
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 67 run function sandstone_summit_booth:presentation/slides/scroll/4/if135
execute if score #limit sandstone_summit_booth.presentation.scroll matches 67 run function sandstone_summit_booth:presentation/slides/scroll/4/if136
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 68
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 68 run function sandstone_summit_booth:presentation/slides/scroll/4/if137
execute if score #limit sandstone_summit_booth.presentation.scroll matches 68 run function sandstone_summit_booth:presentation/slides/scroll/4/if138
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 69
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 69 run function sandstone_summit_booth:presentation/slides/scroll/4/if139
execute if score #limit sandstone_summit_booth.presentation.scroll matches 69 run function sandstone_summit_booth:presentation/slides/scroll/4/if140
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 70
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 70 run function sandstone_summit_booth:presentation/slides/scroll/4/if141
execute if score #limit sandstone_summit_booth.presentation.scroll matches 70 run function sandstone_summit_booth:presentation/slides/scroll/4/if142
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 71
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 71 run function sandstone_summit_booth:presentation/slides/scroll/4/if143
execute if score #limit sandstone_summit_booth.presentation.scroll matches 71 run function sandstone_summit_booth:presentation/slides/scroll/4/if144
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 72
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 72 run function sandstone_summit_booth:presentation/slides/scroll/4/if145
execute if score #limit sandstone_summit_booth.presentation.scroll matches 72 run function sandstone_summit_booth:presentation/slides/scroll/4/if146
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 73
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 73 run function sandstone_summit_booth:presentation/slides/scroll/4/if147
execute if score #limit sandstone_summit_booth.presentation.scroll matches 73 run function sandstone_summit_booth:presentation/slides/scroll/4/if148
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 74
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 74 run function sandstone_summit_booth:presentation/slides/scroll/4/if149
execute if score #limit sandstone_summit_booth.presentation.scroll matches 74 run function sandstone_summit_booth:presentation/slides/scroll/4/if150
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 75
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 75 run function sandstone_summit_booth:presentation/slides/scroll/4/if151
execute if score #limit sandstone_summit_booth.presentation.scroll matches 75 run function sandstone_summit_booth:presentation/slides/scroll/4/if152
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 76
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 76 run function sandstone_summit_booth:presentation/slides/scroll/4/if153
execute if score #limit sandstone_summit_booth.presentation.scroll matches 76 run function sandstone_summit_booth:presentation/slides/scroll/4/if154
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 77
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 77 run function sandstone_summit_booth:presentation/slides/scroll/4/if155
execute if score #limit sandstone_summit_booth.presentation.scroll matches 77 run function sandstone_summit_booth:presentation/slides/scroll/4/if156
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 78
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 78 run function sandstone_summit_booth:presentation/slides/scroll/4/if157
execute if score #limit sandstone_summit_booth.presentation.scroll matches 78 run function sandstone_summit_booth:presentation/slides/scroll/4/if158
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 79
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 79 run function sandstone_summit_booth:presentation/slides/scroll/4/if159
execute if score #limit sandstone_summit_booth.presentation.scroll matches 79 run function sandstone_summit_booth:presentation/slides/scroll/4/if160
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 80
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 80 run function sandstone_summit_booth:presentation/slides/scroll/4/if161
execute if score #limit sandstone_summit_booth.presentation.scroll matches 80 run function sandstone_summit_booth:presentation/slides/scroll/4/if162
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 81
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 81 run function sandstone_summit_booth:presentation/slides/scroll/4/if163
execute if score #limit sandstone_summit_booth.presentation.scroll matches 81 run function sandstone_summit_booth:presentation/slides/scroll/4/if164
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 82
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 82 run function sandstone_summit_booth:presentation/slides/scroll/4/if165
execute if score #limit sandstone_summit_booth.presentation.scroll matches 82 run function sandstone_summit_booth:presentation/slides/scroll/4/if166
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 83
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 83 run function sandstone_summit_booth:presentation/slides/scroll/4/if167
execute if score #limit sandstone_summit_booth.presentation.scroll matches 83 run function sandstone_summit_booth:presentation/slides/scroll/4/if168
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 84
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 84 run function sandstone_summit_booth:presentation/slides/scroll/4/if169
execute if score #limit sandstone_summit_booth.presentation.scroll matches 84 run function sandstone_summit_booth:presentation/slides/scroll/4/if170
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 85
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 85 run function sandstone_summit_booth:presentation/slides/scroll/4/if171
execute if score #limit sandstone_summit_booth.presentation.scroll matches 85 run function sandstone_summit_booth:presentation/slides/scroll/4/if172
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 86
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 86 run function sandstone_summit_booth:presentation/slides/scroll/4/if173
execute if score #limit sandstone_summit_booth.presentation.scroll matches 86 run function sandstone_summit_booth:presentation/slides/scroll/4/if174
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 87
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 87 run function sandstone_summit_booth:presentation/slides/scroll/4/if175
execute if score #limit sandstone_summit_booth.presentation.scroll matches 87 run function sandstone_summit_booth:presentation/slides/scroll/4/if176
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 88
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 88 run function sandstone_summit_booth:presentation/slides/scroll/4/if177
execute if score #limit sandstone_summit_booth.presentation.scroll matches 88 run function sandstone_summit_booth:presentation/slides/scroll/4/if178
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 89
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 89 run function sandstone_summit_booth:presentation/slides/scroll/4/if179
execute if score #limit sandstone_summit_booth.presentation.scroll matches 89 run function sandstone_summit_booth:presentation/slides/scroll/4/if180
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 90
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 90 run function sandstone_summit_booth:presentation/slides/scroll/4/if181
execute if score #limit sandstone_summit_booth.presentation.scroll matches 90 run function sandstone_summit_booth:presentation/slides/scroll/4/if182
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 91
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 91 run function sandstone_summit_booth:presentation/slides/scroll/4/if183
execute if score #limit sandstone_summit_booth.presentation.scroll matches 91 run function sandstone_summit_booth:presentation/slides/scroll/4/if184
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 92
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 92 run function sandstone_summit_booth:presentation/slides/scroll/4/if185
execute if score #limit sandstone_summit_booth.presentation.scroll matches 92 run function sandstone_summit_booth:presentation/slides/scroll/4/if186
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 93
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 93 run function sandstone_summit_booth:presentation/slides/scroll/4/if187
execute if score #limit sandstone_summit_booth.presentation.scroll matches 93 run function sandstone_summit_booth:presentation/slides/scroll/4/if188
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 94
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 94 run function sandstone_summit_booth:presentation/slides/scroll/4/if189
execute if score #limit sandstone_summit_booth.presentation.scroll matches 94 run function sandstone_summit_booth:presentation/slides/scroll/4/if190
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 95
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 95 run function sandstone_summit_booth:presentation/slides/scroll/4/if191
execute if score #limit sandstone_summit_booth.presentation.scroll matches 95 run function sandstone_summit_booth:presentation/slides/scroll/4/if192
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 96
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 96 run function sandstone_summit_booth:presentation/slides/scroll/4/if193
execute if score #limit sandstone_summit_booth.presentation.scroll matches 96 run function sandstone_summit_booth:presentation/slides/scroll/4/if194
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 97
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 97 run function sandstone_summit_booth:presentation/slides/scroll/4/if195
execute if score #limit sandstone_summit_booth.presentation.scroll matches 97 run function sandstone_summit_booth:presentation/slides/scroll/4/if196
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 98
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 98 run function sandstone_summit_booth:presentation/slides/scroll/4/if197
execute if score #limit sandstone_summit_booth.presentation.scroll matches 98 run function sandstone_summit_booth:presentation/slides/scroll/4/if198
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 99
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 99 run function sandstone_summit_booth:presentation/slides/scroll/4/if199
execute if score #limit sandstone_summit_booth.presentation.scroll matches 99 run function sandstone_summit_booth:presentation/slides/scroll/4/if200
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 100
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 100 run function sandstone_summit_booth:presentation/slides/scroll/4/if201
execute if score #limit sandstone_summit_booth.presentation.scroll matches 100 run function sandstone_summit_booth:presentation/slides/scroll/4/if202
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 101
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 101 run function sandstone_summit_booth:presentation/slides/scroll/4/if203
execute if score #limit sandstone_summit_booth.presentation.scroll matches 101 run function sandstone_summit_booth:presentation/slides/scroll/4/if204
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 102
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 102 run function sandstone_summit_booth:presentation/slides/scroll/4/if205
execute if score #limit sandstone_summit_booth.presentation.scroll matches 102 run function sandstone_summit_booth:presentation/slides/scroll/4/if206
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 103
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 103 run function sandstone_summit_booth:presentation/slides/scroll/4/if207
execute if score #limit sandstone_summit_booth.presentation.scroll matches 103 run function sandstone_summit_booth:presentation/slides/scroll/4/if208
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 104
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 104 run function sandstone_summit_booth:presentation/slides/scroll/4/if209
execute if score #limit sandstone_summit_booth.presentation.scroll matches 104 run function sandstone_summit_booth:presentation/slides/scroll/4/if210
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 105
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 105 run function sandstone_summit_booth:presentation/slides/scroll/4/if211
execute if score #limit sandstone_summit_booth.presentation.scroll matches 105 run function sandstone_summit_booth:presentation/slides/scroll/4/if212
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 106
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 106 run function sandstone_summit_booth:presentation/slides/scroll/4/if213
execute if score #limit sandstone_summit_booth.presentation.scroll matches 106 run function sandstone_summit_booth:presentation/slides/scroll/4/if214
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 107
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 107 run function sandstone_summit_booth:presentation/slides/scroll/4/if215
execute if score #limit sandstone_summit_booth.presentation.scroll matches 107 run function sandstone_summit_booth:presentation/slides/scroll/4/if216
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 108
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 108 run function sandstone_summit_booth:presentation/slides/scroll/4/if217
execute if score #limit sandstone_summit_booth.presentation.scroll matches 108 run function sandstone_summit_booth:presentation/slides/scroll/4/if218
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 109
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 109 run function sandstone_summit_booth:presentation/slides/scroll/4/if219
execute if score #limit sandstone_summit_booth.presentation.scroll matches 109 run function sandstone_summit_booth:presentation/slides/scroll/4/if220
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 110
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 110 run function sandstone_summit_booth:presentation/slides/scroll/4/if221
execute if score #limit sandstone_summit_booth.presentation.scroll matches 110 run function sandstone_summit_booth:presentation/slides/scroll/4/if222
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 111
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 111 run function sandstone_summit_booth:presentation/slides/scroll/4/if223
execute if score #limit sandstone_summit_booth.presentation.scroll matches 111 run function sandstone_summit_booth:presentation/slides/scroll/4/if224
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 112
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 112 run function sandstone_summit_booth:presentation/slides/scroll/4/if225
execute if score #limit sandstone_summit_booth.presentation.scroll matches 112 run function sandstone_summit_booth:presentation/slides/scroll/4/if226
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 113
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 113 run function sandstone_summit_booth:presentation/slides/scroll/4/if227
execute if score #limit sandstone_summit_booth.presentation.scroll matches 113 run function sandstone_summit_booth:presentation/slides/scroll/4/if228
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 114
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 114 run function sandstone_summit_booth:presentation/slides/scroll/4/if229
execute if score #limit sandstone_summit_booth.presentation.scroll matches 114 run function sandstone_summit_booth:presentation/slides/scroll/4/if230
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 115
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 115 run function sandstone_summit_booth:presentation/slides/scroll/4/if231
execute if score #limit sandstone_summit_booth.presentation.scroll matches 115 run function sandstone_summit_booth:presentation/slides/scroll/4/if232
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 116
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 116 run function sandstone_summit_booth:presentation/slides/scroll/4/if233
execute if score #limit sandstone_summit_booth.presentation.scroll matches 116 run function sandstone_summit_booth:presentation/slides/scroll/4/if234
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 117
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 117 run function sandstone_summit_booth:presentation/slides/scroll/4/if235
execute if score #limit sandstone_summit_booth.presentation.scroll matches 117 run function sandstone_summit_booth:presentation/slides/scroll/4/if236
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 118
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 118 run function sandstone_summit_booth:presentation/slides/scroll/4/if237
execute if score #limit sandstone_summit_booth.presentation.scroll matches 118 run function sandstone_summit_booth:presentation/slides/scroll/4/if238
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 119
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 119 run function sandstone_summit_booth:presentation/slides/scroll/4/if239
execute if score #limit sandstone_summit_booth.presentation.scroll matches 119 run function sandstone_summit_booth:presentation/slides/scroll/4/if240
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 120
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 120 run function sandstone_summit_booth:presentation/slides/scroll/4/if241
execute if score #limit sandstone_summit_booth.presentation.scroll matches 120 run function sandstone_summit_booth:presentation/slides/scroll/4/if242
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 121
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 121 run function sandstone_summit_booth:presentation/slides/scroll/4/if243
execute if score #limit sandstone_summit_booth.presentation.scroll matches 121 run function sandstone_summit_booth:presentation/slides/scroll/4/if244
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 122
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 122 run function sandstone_summit_booth:presentation/slides/scroll/4/if245
execute if score #limit sandstone_summit_booth.presentation.scroll matches 122 run function sandstone_summit_booth:presentation/slides/scroll/4/if246
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 123
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 123 run function sandstone_summit_booth:presentation/slides/scroll/4/if247
execute if score #limit sandstone_summit_booth.presentation.scroll matches 123 run function sandstone_summit_booth:presentation/slides/scroll/4/if248
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 124
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 124 run function sandstone_summit_booth:presentation/slides/scroll/4/if249
execute if score #limit sandstone_summit_booth.presentation.scroll matches 124 run function sandstone_summit_booth:presentation/slides/scroll/4/if250
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 125
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 125 run function sandstone_summit_booth:presentation/slides/scroll/4/if251
execute if score #limit sandstone_summit_booth.presentation.scroll matches 125 run function sandstone_summit_booth:presentation/slides/scroll/4/if252
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 126
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 126 run function sandstone_summit_booth:presentation/slides/scroll/4/if253
execute if score #limit sandstone_summit_booth.presentation.scroll matches 126 run function sandstone_summit_booth:presentation/slides/scroll/4/if254
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 127
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 127 run function sandstone_summit_booth:presentation/slides/scroll/4/if255
execute if score #limit sandstone_summit_booth.presentation.scroll matches 127 run function sandstone_summit_booth:presentation/slides/scroll/4/if256
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 128
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 128 run function sandstone_summit_booth:presentation/slides/scroll/4/if257
execute if score #limit sandstone_summit_booth.presentation.scroll matches 128 run function sandstone_summit_booth:presentation/slides/scroll/4/if258
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 129
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 129 run function sandstone_summit_booth:presentation/slides/scroll/4/if259
execute if score #limit sandstone_summit_booth.presentation.scroll matches 129 run function sandstone_summit_booth:presentation/slides/scroll/4/if260
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 130
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 130 run function sandstone_summit_booth:presentation/slides/scroll/4/if261
execute if score #limit sandstone_summit_booth.presentation.scroll matches 130 run function sandstone_summit_booth:presentation/slides/scroll/4/if262
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 131
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 131 run function sandstone_summit_booth:presentation/slides/scroll/4/if263
execute if score #limit sandstone_summit_booth.presentation.scroll matches 131 run function sandstone_summit_booth:presentation/slides/scroll/4/if264
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 132
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 132 run function sandstone_summit_booth:presentation/slides/scroll/4/if265
execute if score #limit sandstone_summit_booth.presentation.scroll matches 132 run function sandstone_summit_booth:presentation/slides/scroll/4/if266
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 133
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 133 run function sandstone_summit_booth:presentation/slides/scroll/4/if267
execute if score #limit sandstone_summit_booth.presentation.scroll matches 133 run function sandstone_summit_booth:presentation/slides/scroll/4/if268
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 134
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 134 run function sandstone_summit_booth:presentation/slides/scroll/4/if269
execute if score #limit sandstone_summit_booth.presentation.scroll matches 134 run function sandstone_summit_booth:presentation/slides/scroll/4/if270
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 135
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 135 run function sandstone_summit_booth:presentation/slides/scroll/4/if271
execute if score #limit sandstone_summit_booth.presentation.scroll matches 135 run function sandstone_summit_booth:presentation/slides/scroll/4/if272
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 136
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 136 run function sandstone_summit_booth:presentation/slides/scroll/4/if273
execute if score #limit sandstone_summit_booth.presentation.scroll matches 136 run function sandstone_summit_booth:presentation/slides/scroll/4/if274
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 137
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 137 run function sandstone_summit_booth:presentation/slides/scroll/4/if275
execute if score #limit sandstone_summit_booth.presentation.scroll matches 137 run function sandstone_summit_booth:presentation/slides/scroll/4/if276
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 138
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 138 run function sandstone_summit_booth:presentation/slides/scroll/4/if277
execute if score #limit sandstone_summit_booth.presentation.scroll matches 138 run function sandstone_summit_booth:presentation/slides/scroll/4/if278
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 139
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 139 run function sandstone_summit_booth:presentation/slides/scroll/4/if279
execute if score #limit sandstone_summit_booth.presentation.scroll matches 139 run function sandstone_summit_booth:presentation/slides/scroll/4/if280
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 140
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 140 run function sandstone_summit_booth:presentation/slides/scroll/4/if281
execute if score #limit sandstone_summit_booth.presentation.scroll matches 140 run function sandstone_summit_booth:presentation/slides/scroll/4/if282
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 141
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 141 run function sandstone_summit_booth:presentation/slides/scroll/4/if283
execute if score #limit sandstone_summit_booth.presentation.scroll matches 141 run function sandstone_summit_booth:presentation/slides/scroll/4/if284
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 142
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 142 run function sandstone_summit_booth:presentation/slides/scroll/4/if285
execute if score #limit sandstone_summit_booth.presentation.scroll matches 142 run function sandstone_summit_booth:presentation/slides/scroll/4/if286
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 143
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 143 run function sandstone_summit_booth:presentation/slides/scroll/4/if287
execute if score #limit sandstone_summit_booth.presentation.scroll matches 143 run function sandstone_summit_booth:presentation/slides/scroll/4/if288
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 144
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 144 run function sandstone_summit_booth:presentation/slides/scroll/4/if289
execute if score #limit sandstone_summit_booth.presentation.scroll matches 144 run function sandstone_summit_booth:presentation/slides/scroll/4/if290
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 145
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 145 run function sandstone_summit_booth:presentation/slides/scroll/4/if291
execute if score #limit sandstone_summit_booth.presentation.scroll matches 145 run function sandstone_summit_booth:presentation/slides/scroll/4/if292
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 146
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 146 run function sandstone_summit_booth:presentation/slides/scroll/4/if293
execute if score #limit sandstone_summit_booth.presentation.scroll matches 146 run function sandstone_summit_booth:presentation/slides/scroll/4/if294
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 147
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 147 run function sandstone_summit_booth:presentation/slides/scroll/4/if295
execute if score #limit sandstone_summit_booth.presentation.scroll matches 147 run function sandstone_summit_booth:presentation/slides/scroll/4/if296
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 148
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 148 run function sandstone_summit_booth:presentation/slides/scroll/4/if297
execute if score #limit sandstone_summit_booth.presentation.scroll matches 148 run function sandstone_summit_booth:presentation/slides/scroll/4/if298
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 149
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 149 run function sandstone_summit_booth:presentation/slides/scroll/4/if299
execute if score #limit sandstone_summit_booth.presentation.scroll matches 149 run function sandstone_summit_booth:presentation/slides/scroll/4/if300
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 150
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 150 run function sandstone_summit_booth:presentation/slides/scroll/4/if301
execute if score #limit sandstone_summit_booth.presentation.scroll matches 150 run function sandstone_summit_booth:presentation/slides/scroll/4/if302
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 151
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 151 run function sandstone_summit_booth:presentation/slides/scroll/4/if303
execute if score #limit sandstone_summit_booth.presentation.scroll matches 151 run function sandstone_summit_booth:presentation/slides/scroll/4/if304
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 152
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 152 run function sandstone_summit_booth:presentation/slides/scroll/4/if305
execute if score #limit sandstone_summit_booth.presentation.scroll matches 152 run function sandstone_summit_booth:presentation/slides/scroll/4/if306
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 153
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 153 run function sandstone_summit_booth:presentation/slides/scroll/4/if307
execute if score #limit sandstone_summit_booth.presentation.scroll matches 153 run function sandstone_summit_booth:presentation/slides/scroll/4/if308
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 154
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 154 run function sandstone_summit_booth:presentation/slides/scroll/4/if309
execute if score #limit sandstone_summit_booth.presentation.scroll matches 154 run function sandstone_summit_booth:presentation/slides/scroll/4/if310
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 155
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 155 run function sandstone_summit_booth:presentation/slides/scroll/4/if311
execute if score #limit sandstone_summit_booth.presentation.scroll matches 155 run function sandstone_summit_booth:presentation/slides/scroll/4/if312
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 156
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 156 run function sandstone_summit_booth:presentation/slides/scroll/4/if313
execute if score #limit sandstone_summit_booth.presentation.scroll matches 156 run function sandstone_summit_booth:presentation/slides/scroll/4/if314
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 157
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 157 run function sandstone_summit_booth:presentation/slides/scroll/4/if315
execute if score #limit sandstone_summit_booth.presentation.scroll matches 157 run function sandstone_summit_booth:presentation/slides/scroll/4/if316
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 158
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 158 run function sandstone_summit_booth:presentation/slides/scroll/4/if317
execute if score #limit sandstone_summit_booth.presentation.scroll matches 158 run function sandstone_summit_booth:presentation/slides/scroll/4/if318
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 159
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 159 run function sandstone_summit_booth:presentation/slides/scroll/4/if319
execute if score #limit sandstone_summit_booth.presentation.scroll matches 159 run function sandstone_summit_booth:presentation/slides/scroll/4/if320
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 160
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 160 run function sandstone_summit_booth:presentation/slides/scroll/4/if321
execute if score #limit sandstone_summit_booth.presentation.scroll matches 160 run function sandstone_summit_booth:presentation/slides/scroll/4/if322
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 161
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 161 run function sandstone_summit_booth:presentation/slides/scroll/4/if323
execute if score #limit sandstone_summit_booth.presentation.scroll matches 161 run function sandstone_summit_booth:presentation/slides/scroll/4/if324
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 162
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 162 run function sandstone_summit_booth:presentation/slides/scroll/4/if325
execute if score #limit sandstone_summit_booth.presentation.scroll matches 162 run function sandstone_summit_booth:presentation/slides/scroll/4/if326
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 163
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 163 run function sandstone_summit_booth:presentation/slides/scroll/4/if327
execute if score #limit sandstone_summit_booth.presentation.scroll matches 163 run function sandstone_summit_booth:presentation/slides/scroll/4/if328
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 164
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 164 run function sandstone_summit_booth:presentation/slides/scroll/4/if329
execute if score #limit sandstone_summit_booth.presentation.scroll matches 164 run function sandstone_summit_booth:presentation/slides/scroll/4/if330
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 165
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 165 run function sandstone_summit_booth:presentation/slides/scroll/4/if331
execute if score #limit sandstone_summit_booth.presentation.scroll matches 165 run function sandstone_summit_booth:presentation/slides/scroll/4/if332
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 166
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 166 run function sandstone_summit_booth:presentation/slides/scroll/4/if333
execute if score #limit sandstone_summit_booth.presentation.scroll matches 166 run function sandstone_summit_booth:presentation/slides/scroll/4/if334
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 167
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 167 run function sandstone_summit_booth:presentation/slides/scroll/4/if335
execute if score #limit sandstone_summit_booth.presentation.scroll matches 167 run function sandstone_summit_booth:presentation/slides/scroll/4/if336
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 168
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 168 run function sandstone_summit_booth:presentation/slides/scroll/4/if337
execute if score #limit sandstone_summit_booth.presentation.scroll matches 168 run function sandstone_summit_booth:presentation/slides/scroll/4/if338
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 169
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 169 run function sandstone_summit_booth:presentation/slides/scroll/4/if339
execute if score #limit sandstone_summit_booth.presentation.scroll matches 169 run function sandstone_summit_booth:presentation/slides/scroll/4/if340
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 170
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 170 run function sandstone_summit_booth:presentation/slides/scroll/4/if341
execute if score #limit sandstone_summit_booth.presentation.scroll matches 170 run function sandstone_summit_booth:presentation/slides/scroll/4/if342
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 171
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 171 run function sandstone_summit_booth:presentation/slides/scroll/4/if343
execute if score #limit sandstone_summit_booth.presentation.scroll matches 171 run function sandstone_summit_booth:presentation/slides/scroll/4/if344
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 172
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 172 run function sandstone_summit_booth:presentation/slides/scroll/4/if345
execute if score #limit sandstone_summit_booth.presentation.scroll matches 172 run function sandstone_summit_booth:presentation/slides/scroll/4/if346
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 173
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 173 run function sandstone_summit_booth:presentation/slides/scroll/4/if347
execute if score #limit sandstone_summit_booth.presentation.scroll matches 173 run function sandstone_summit_booth:presentation/slides/scroll/4/if348
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 174
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 174 run function sandstone_summit_booth:presentation/slides/scroll/4/if349
execute if score #limit sandstone_summit_booth.presentation.scroll matches 174 run function sandstone_summit_booth:presentation/slides/scroll/4/if350
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 175
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 175 run function sandstone_summit_booth:presentation/slides/scroll/4/if351
execute if score #limit sandstone_summit_booth.presentation.scroll matches 175 run function sandstone_summit_booth:presentation/slides/scroll/4/if352
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 176
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 176 run function sandstone_summit_booth:presentation/slides/scroll/4/if353
execute if score #limit sandstone_summit_booth.presentation.scroll matches 176 run function sandstone_summit_booth:presentation/slides/scroll/4/if354
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 177
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 177 run function sandstone_summit_booth:presentation/slides/scroll/4/if355
execute if score #limit sandstone_summit_booth.presentation.scroll matches 177 run function sandstone_summit_booth:presentation/slides/scroll/4/if356
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 178
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 178 run function sandstone_summit_booth:presentation/slides/scroll/4/if357
execute if score #limit sandstone_summit_booth.presentation.scroll matches 178 run function sandstone_summit_booth:presentation/slides/scroll/4/if358
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 179
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 179 run function sandstone_summit_booth:presentation/slides/scroll/4/if359
execute if score #limit sandstone_summit_booth.presentation.scroll matches 179 run function sandstone_summit_booth:presentation/slides/scroll/4/if360
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 180
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 180 run function sandstone_summit_booth:presentation/slides/scroll/4/if361
execute if score #limit sandstone_summit_booth.presentation.scroll matches 180 run function sandstone_summit_booth:presentation/slides/scroll/4/if362
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 181
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 181 run function sandstone_summit_booth:presentation/slides/scroll/4/if363
execute if score #limit sandstone_summit_booth.presentation.scroll matches 181 run function sandstone_summit_booth:presentation/slides/scroll/4/if364
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 182
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 182 run function sandstone_summit_booth:presentation/slides/scroll/4/if365
execute if score #limit sandstone_summit_booth.presentation.scroll matches 182 run function sandstone_summit_booth:presentation/slides/scroll/4/if366
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 183
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 183 run function sandstone_summit_booth:presentation/slides/scroll/4/if367
execute if score #limit sandstone_summit_booth.presentation.scroll matches 183 run function sandstone_summit_booth:presentation/slides/scroll/4/if368
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 184
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 184 run function sandstone_summit_booth:presentation/slides/scroll/4/if369
execute if score #limit sandstone_summit_booth.presentation.scroll matches 184 run function sandstone_summit_booth:presentation/slides/scroll/4/if370
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 185
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 185 run function sandstone_summit_booth:presentation/slides/scroll/4/if371
execute if score #limit sandstone_summit_booth.presentation.scroll matches 185 run function sandstone_summit_booth:presentation/slides/scroll/4/if372
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 186
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 186 run function sandstone_summit_booth:presentation/slides/scroll/4/if373
execute if score #limit sandstone_summit_booth.presentation.scroll matches 186 run function sandstone_summit_booth:presentation/slides/scroll/4/if374
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 187
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 187 run function sandstone_summit_booth:presentation/slides/scroll/4/if375
execute if score #limit sandstone_summit_booth.presentation.scroll matches 187 run function sandstone_summit_booth:presentation/slides/scroll/4/if376
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 188
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 188 run function sandstone_summit_booth:presentation/slides/scroll/4/if377
execute if score #limit sandstone_summit_booth.presentation.scroll matches 188 run function sandstone_summit_booth:presentation/slides/scroll/4/if378
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 189
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 189 run function sandstone_summit_booth:presentation/slides/scroll/4/if379
execute if score #limit sandstone_summit_booth.presentation.scroll matches 189 run function sandstone_summit_booth:presentation/slides/scroll/4/if380
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 190
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 190 run function sandstone_summit_booth:presentation/slides/scroll/4/if381
execute if score #limit sandstone_summit_booth.presentation.scroll matches 190 run function sandstone_summit_booth:presentation/slides/scroll/4/if382
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 191
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 191 run function sandstone_summit_booth:presentation/slides/scroll/4/if383
execute if score #limit sandstone_summit_booth.presentation.scroll matches 191 run function sandstone_summit_booth:presentation/slides/scroll/4/if384
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 192
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 192 run function sandstone_summit_booth:presentation/slides/scroll/4/if385
execute if score #limit sandstone_summit_booth.presentation.scroll matches 192 run function sandstone_summit_booth:presentation/slides/scroll/4/if386
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 193
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 193 run function sandstone_summit_booth:presentation/slides/scroll/4/if387
execute if score #limit sandstone_summit_booth.presentation.scroll matches 193 run function sandstone_summit_booth:presentation/slides/scroll/4/if388
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 194
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 194 run function sandstone_summit_booth:presentation/slides/scroll/4/if389
execute if score #limit sandstone_summit_booth.presentation.scroll matches 194 run function sandstone_summit_booth:presentation/slides/scroll/4/if390
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 195
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 195 run function sandstone_summit_booth:presentation/slides/scroll/4/if391
execute if score #limit sandstone_summit_booth.presentation.scroll matches 195 run function sandstone_summit_booth:presentation/slides/scroll/4/if392
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 196
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 196 run function sandstone_summit_booth:presentation/slides/scroll/4/if393
execute if score #limit sandstone_summit_booth.presentation.scroll matches 196 run function sandstone_summit_booth:presentation/slides/scroll/4/if394
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 197
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 197 run function sandstone_summit_booth:presentation/slides/scroll/4/if395
execute if score #limit sandstone_summit_booth.presentation.scroll matches 197 run function sandstone_summit_booth:presentation/slides/scroll/4/if396
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 198
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 198 run function sandstone_summit_booth:presentation/slides/scroll/4/if397
execute if score #limit sandstone_summit_booth.presentation.scroll matches 198 run function sandstone_summit_booth:presentation/slides/scroll/4/if398
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 199
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 199 run function sandstone_summit_booth:presentation/slides/scroll/4/if399
execute if score #limit sandstone_summit_booth.presentation.scroll matches 199 run function sandstone_summit_booth:presentation/slides/scroll/4/if400
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 200
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 200 run function sandstone_summit_booth:presentation/slides/scroll/4/if401
execute if score #limit sandstone_summit_booth.presentation.scroll matches 200 run function sandstone_summit_booth:presentation/slides/scroll/4/if402
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 201
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 201 run function sandstone_summit_booth:presentation/slides/scroll/4/if403
execute if score #limit sandstone_summit_booth.presentation.scroll matches 201 run function sandstone_summit_booth:presentation/slides/scroll/4/if404
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 202
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 202 run function sandstone_summit_booth:presentation/slides/scroll/4/if405
execute if score #limit sandstone_summit_booth.presentation.scroll matches 202 run function sandstone_summit_booth:presentation/slides/scroll/4/if406
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 203
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 203 run function sandstone_summit_booth:presentation/slides/scroll/4/if407
execute if score #limit sandstone_summit_booth.presentation.scroll matches 203 run function sandstone_summit_booth:presentation/slides/scroll/4/if408
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 204
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 204 run function sandstone_summit_booth:presentation/slides/scroll/4/if409
execute if score #limit sandstone_summit_booth.presentation.scroll matches 204 run function sandstone_summit_booth:presentation/slides/scroll/4/if410
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 205
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 205 run function sandstone_summit_booth:presentation/slides/scroll/4/if411
execute if score #limit sandstone_summit_booth.presentation.scroll matches 205 run function sandstone_summit_booth:presentation/slides/scroll/4/if412
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 206
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 206 run function sandstone_summit_booth:presentation/slides/scroll/4/if413
execute if score #limit sandstone_summit_booth.presentation.scroll matches 206 run function sandstone_summit_booth:presentation/slides/scroll/4/if414
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 207
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 207 run function sandstone_summit_booth:presentation/slides/scroll/4/if415
execute if score #limit sandstone_summit_booth.presentation.scroll matches 207 run function sandstone_summit_booth:presentation/slides/scroll/4/if416
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 208
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 208 run function sandstone_summit_booth:presentation/slides/scroll/4/if417
execute if score #limit sandstone_summit_booth.presentation.scroll matches 208 run function sandstone_summit_booth:presentation/slides/scroll/4/if418
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 209
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 209 run function sandstone_summit_booth:presentation/slides/scroll/4/if419
execute if score #limit sandstone_summit_booth.presentation.scroll matches 209 run function sandstone_summit_booth:presentation/slides/scroll/4/if420
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 210
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 210 run function sandstone_summit_booth:presentation/slides/scroll/4/if421
execute if score #limit sandstone_summit_booth.presentation.scroll matches 210 run function sandstone_summit_booth:presentation/slides/scroll/4/if422
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 211
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 211 run function sandstone_summit_booth:presentation/slides/scroll/4/if423
execute if score #limit sandstone_summit_booth.presentation.scroll matches 211 run function sandstone_summit_booth:presentation/slides/scroll/4/if424
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 212
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 212 run function sandstone_summit_booth:presentation/slides/scroll/4/if425
execute if score #limit sandstone_summit_booth.presentation.scroll matches 212 run function sandstone_summit_booth:presentation/slides/scroll/4/if426
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 213
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 213 run function sandstone_summit_booth:presentation/slides/scroll/4/if427
execute if score #limit sandstone_summit_booth.presentation.scroll matches 213 run function sandstone_summit_booth:presentation/slides/scroll/4/if428
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 214
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 214 run function sandstone_summit_booth:presentation/slides/scroll/4/if429
execute if score #limit sandstone_summit_booth.presentation.scroll matches 214 run function sandstone_summit_booth:presentation/slides/scroll/4/if430
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 215
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 215 run function sandstone_summit_booth:presentation/slides/scroll/4/if431
execute if score #limit sandstone_summit_booth.presentation.scroll matches 215 run function sandstone_summit_booth:presentation/slides/scroll/4/if432
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 216
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 216 run function sandstone_summit_booth:presentation/slides/scroll/4/if433
execute if score #limit sandstone_summit_booth.presentation.scroll matches 216 run function sandstone_summit_booth:presentation/slides/scroll/4/if434
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 217
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 217 run function sandstone_summit_booth:presentation/slides/scroll/4/if435
execute if score #limit sandstone_summit_booth.presentation.scroll matches 217 run function sandstone_summit_booth:presentation/slides/scroll/4/if436
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 218
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 218 run function sandstone_summit_booth:presentation/slides/scroll/4/if437
execute if score #limit sandstone_summit_booth.presentation.scroll matches 218 run function sandstone_summit_booth:presentation/slides/scroll/4/if438
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 219
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 219 run function sandstone_summit_booth:presentation/slides/scroll/4/if439
execute if score #limit sandstone_summit_booth.presentation.scroll matches 219 run function sandstone_summit_booth:presentation/slides/scroll/4/if440
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 220
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 220 run function sandstone_summit_booth:presentation/slides/scroll/4/if441
execute if score #limit sandstone_summit_booth.presentation.scroll matches 220 run function sandstone_summit_booth:presentation/slides/scroll/4/if442
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 221
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 221 run function sandstone_summit_booth:presentation/slides/scroll/4/if443
execute if score #limit sandstone_summit_booth.presentation.scroll matches 221 run function sandstone_summit_booth:presentation/slides/scroll/4/if444
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 222
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 222 run function sandstone_summit_booth:presentation/slides/scroll/4/if445
execute if score #limit sandstone_summit_booth.presentation.scroll matches 222 run function sandstone_summit_booth:presentation/slides/scroll/4/if446
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 223
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 223 run function sandstone_summit_booth:presentation/slides/scroll/4/if447
execute if score #limit sandstone_summit_booth.presentation.scroll matches 223 run function sandstone_summit_booth:presentation/slides/scroll/4/if448
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 224
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 224 run function sandstone_summit_booth:presentation/slides/scroll/4/if449
execute if score #limit sandstone_summit_booth.presentation.scroll matches 224 run function sandstone_summit_booth:presentation/slides/scroll/4/if450
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 225
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 225 run function sandstone_summit_booth:presentation/slides/scroll/4/if451
execute if score #limit sandstone_summit_booth.presentation.scroll matches 225 run function sandstone_summit_booth:presentation/slides/scroll/4/if452
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 226
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 226 run function sandstone_summit_booth:presentation/slides/scroll/4/if453
execute if score #limit sandstone_summit_booth.presentation.scroll matches 226 run function sandstone_summit_booth:presentation/slides/scroll/4/if454
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 227
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 227 run function sandstone_summit_booth:presentation/slides/scroll/4/if455
execute if score #limit sandstone_summit_booth.presentation.scroll matches 227 run function sandstone_summit_booth:presentation/slides/scroll/4/if456
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 228
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 228 run function sandstone_summit_booth:presentation/slides/scroll/4/if457
execute if score #limit sandstone_summit_booth.presentation.scroll matches 228 run function sandstone_summit_booth:presentation/slides/scroll/4/if458
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 229
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 229 run function sandstone_summit_booth:presentation/slides/scroll/4/if459
execute if score #limit sandstone_summit_booth.presentation.scroll matches 229 run function sandstone_summit_booth:presentation/slides/scroll/4/if460
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 230
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 230 run function sandstone_summit_booth:presentation/slides/scroll/4/if461
execute if score #limit sandstone_summit_booth.presentation.scroll matches 230 run function sandstone_summit_booth:presentation/slides/scroll/4/if462
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 231
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 231 run function sandstone_summit_booth:presentation/slides/scroll/4/if463
execute if score #limit sandstone_summit_booth.presentation.scroll matches 231 run function sandstone_summit_booth:presentation/slides/scroll/4/if464
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 232
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 232 run function sandstone_summit_booth:presentation/slides/scroll/4/if465
execute if score #limit sandstone_summit_booth.presentation.scroll matches 232 run function sandstone_summit_booth:presentation/slides/scroll/4/if466
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 233
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 233 run function sandstone_summit_booth:presentation/slides/scroll/4/if467
execute if score #limit sandstone_summit_booth.presentation.scroll matches 233 run function sandstone_summit_booth:presentation/slides/scroll/4/if468
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 234
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 234 run function sandstone_summit_booth:presentation/slides/scroll/4/if469
execute if score #limit sandstone_summit_booth.presentation.scroll matches 234 run function sandstone_summit_booth:presentation/slides/scroll/4/if470
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 235
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 235 run function sandstone_summit_booth:presentation/slides/scroll/4/if471
execute if score #limit sandstone_summit_booth.presentation.scroll matches 235 run function sandstone_summit_booth:presentation/slides/scroll/4/if472
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 236
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 236 run function sandstone_summit_booth:presentation/slides/scroll/4/if473
execute if score #limit sandstone_summit_booth.presentation.scroll matches 236 run function sandstone_summit_booth:presentation/slides/scroll/4/if474
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 237
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 237 run function sandstone_summit_booth:presentation/slides/scroll/4/if475
execute if score #limit sandstone_summit_booth.presentation.scroll matches 237 run function sandstone_summit_booth:presentation/slides/scroll/4/if476
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 238
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 238 run function sandstone_summit_booth:presentation/slides/scroll/4/if477
execute if score #limit sandstone_summit_booth.presentation.scroll matches 238 run function sandstone_summit_booth:presentation/slides/scroll/4/if478
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 239
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 239 run function sandstone_summit_booth:presentation/slides/scroll/4/if479
execute if score #limit sandstone_summit_booth.presentation.scroll matches 239 run function sandstone_summit_booth:presentation/slides/scroll/4/if480
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 240
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 240 run function sandstone_summit_booth:presentation/slides/scroll/4/if481
execute if score #limit sandstone_summit_booth.presentation.scroll matches 240 run function sandstone_summit_booth:presentation/slides/scroll/4/if482
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 241
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 241 run function sandstone_summit_booth:presentation/slides/scroll/4/if483
execute if score #limit sandstone_summit_booth.presentation.scroll matches 241 run function sandstone_summit_booth:presentation/slides/scroll/4/if484
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 242
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 242 run function sandstone_summit_booth:presentation/slides/scroll/4/if485
execute if score #limit sandstone_summit_booth.presentation.scroll matches 242 run function sandstone_summit_booth:presentation/slides/scroll/4/if486
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 243
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 243 run function sandstone_summit_booth:presentation/slides/scroll/4/if487
execute if score #limit sandstone_summit_booth.presentation.scroll matches 243 run function sandstone_summit_booth:presentation/slides/scroll/4/if488
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 244
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 244 run function sandstone_summit_booth:presentation/slides/scroll/4/if489
execute if score #limit sandstone_summit_booth.presentation.scroll matches 244 run function sandstone_summit_booth:presentation/slides/scroll/4/if490
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 245
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 245 run function sandstone_summit_booth:presentation/slides/scroll/4/if491
execute if score #limit sandstone_summit_booth.presentation.scroll matches 245 run function sandstone_summit_booth:presentation/slides/scroll/4/if492
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 246
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 246 run function sandstone_summit_booth:presentation/slides/scroll/4/if493
execute if score #limit sandstone_summit_booth.presentation.scroll matches 246 run function sandstone_summit_booth:presentation/slides/scroll/4/if494
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 247
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 247 run function sandstone_summit_booth:presentation/slides/scroll/4/if495
execute if score #limit sandstone_summit_booth.presentation.scroll matches 247 run function sandstone_summit_booth:presentation/slides/scroll/4/if496
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 248
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 248 run function sandstone_summit_booth:presentation/slides/scroll/4/if497
execute if score #limit sandstone_summit_booth.presentation.scroll matches 248 run function sandstone_summit_booth:presentation/slides/scroll/4/if498
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 249
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 249 run function sandstone_summit_booth:presentation/slides/scroll/4/if499
execute if score #limit sandstone_summit_booth.presentation.scroll matches 249 run function sandstone_summit_booth:presentation/slides/scroll/4/if500
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 250
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 250 run function sandstone_summit_booth:presentation/slides/scroll/4/if501
execute if score #limit sandstone_summit_booth.presentation.scroll matches 250 run function sandstone_summit_booth:presentation/slides/scroll/4/if502
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 251
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 251 run function sandstone_summit_booth:presentation/slides/scroll/4/if503
execute if score #limit sandstone_summit_booth.presentation.scroll matches 251 run function sandstone_summit_booth:presentation/slides/scroll/4/if504
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 252
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 252 run function sandstone_summit_booth:presentation/slides/scroll/4/if505
execute if score #limit sandstone_summit_booth.presentation.scroll matches 252 run function sandstone_summit_booth:presentation/slides/scroll/4/if506
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 253
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 253 run function sandstone_summit_booth:presentation/slides/scroll/4/if507
execute if score #limit sandstone_summit_booth.presentation.scroll matches 253 run function sandstone_summit_booth:presentation/slides/scroll/4/if508
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 254
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 254 run function sandstone_summit_booth:presentation/slides/scroll/4/if509
execute if score #limit sandstone_summit_booth.presentation.scroll matches 254 run function sandstone_summit_booth:presentation/slides/scroll/4/if510
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 255
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 255 run function sandstone_summit_booth:presentation/slides/scroll/4/if511
execute if score #limit sandstone_summit_booth.presentation.scroll matches 255 run function sandstone_summit_booth:presentation/slides/scroll/4/if512
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 256
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute unless score #limit sandstone_summit_booth.presentation.scroll matches 256 run function sandstone_summit_booth:presentation/slides/scroll/4/if513
execute if score #limit sandstone_summit_booth.presentation.scroll matches 256 run function sandstone_summit_booth:presentation/slides/scroll/4/if514