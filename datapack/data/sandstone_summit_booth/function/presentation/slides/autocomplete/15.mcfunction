execute store result score #current_time sandstone_summit_booth.presentation.scroll run time query gametime
scoreboard players operation #elapsed sandstone_summit_booth.presentation.scroll = #current_time sandstone_summit_booth.presentation.scroll
scoreboard players operation #elapsed sandstone_summit_booth.presentation.scroll -= #shown_at sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 5
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll = #elapsed sandstone_summit_booth.presentation.scroll
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll /= #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 115
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll < #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 0
scoreboard players operation #offset sandstone_summit_booth.presentation.scroll > #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 0
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 0 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 1
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 1 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if2
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 2
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 2 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if3
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 3
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 3 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if4
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 4
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 4 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if5
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 5
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 5 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if6
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 6
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 6 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if7
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 7
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 7 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if8
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 8
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 8 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if9
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 9
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 9 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if10
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 10
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 10 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if11
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 11
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 11 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if12
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 12
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 12 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if13
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 13
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 13 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if14
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 14
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 14 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if15
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 15
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 15 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if16
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 16
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 16 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if17
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 17
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 17 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if18
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 18
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 18 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if19
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 19
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 19 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if20
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 20
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 20 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if21
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 21
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 21 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if22
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 22
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 22 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if23
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 23
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 23 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if24
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 24
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 24 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if25
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 25
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 25 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if26
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 26
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 26 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if27
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 27
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 27 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if28
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 28
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 28 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if29
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 29
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 29 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if30
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 30
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 30 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if31
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 31
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 31 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if32
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 32
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 32 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if33
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 33
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 33 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if34
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 34
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 34 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if35
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 35
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 35 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if36
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 36
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 36 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if37
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 37
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 37 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if38
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 38
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 38 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if39
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 39
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 39 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if40
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 40
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 40 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if41
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 41
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 41 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if42
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 42
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 42 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if43
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 43
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 43 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if44
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 44
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 44 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if45
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 45
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 45 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if46
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 46
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 46 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if47
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 47
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 47 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if48
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 48
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 48 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if49
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 49
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 49 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if50
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 50
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 50 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if51
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 51
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 51 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if52
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 52
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 52 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if53
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 53
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 53 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if54
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 54
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 54 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if55
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 55
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 55 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if56
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 56
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 56 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if57
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 57
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 57 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if58
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 58
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 58 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if59
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 59
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 59 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if60
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 60
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 60 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if61
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 61
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 61 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if62
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 62
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 62 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if63
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 63
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 63 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if64
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 64
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 64 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if65
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 65
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 65 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if66
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 66
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 66 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if67
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 67
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 67 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if68
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 68
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 68 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if69
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 69
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 69 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if70
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 70
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 70 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if71
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 71
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 71 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if72
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 72
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 72 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if73
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 73
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 73 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if74
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 74
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 74 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if75
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 75
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 75 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if76
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 76
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 76 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if77
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 77
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 77 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if78
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 78
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 78 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if79
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 79
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 79 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if80
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 80
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 80 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if81
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 81
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 81 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if82
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 82
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 82 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if83
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 83
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 83 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if84
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 84
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 84 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if85
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 85
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 85 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if86
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 86
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 86 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if87
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 87
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 87 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if88
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 88
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 88 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if89
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 89
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 89 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if90
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 90
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 90 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if91
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 91
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 91 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if92
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 92
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 92 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if93
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 93
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 93 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if94
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 94
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 94 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if95
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 95
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 95 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if96
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 96
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 96 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if97
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 97
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 97 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if98
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 98
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 98 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if99
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 99
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 99 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if100
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 100
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 100 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if101
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 101
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 101 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if102
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 102
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 102 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if103
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 103
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 103 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if104
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 104
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 104 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if105
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 105
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 105 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if106
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 106
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 106 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if107
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 107
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 107 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if108
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 108
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 108 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if109
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 109
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 109 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if110
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 110
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 110 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if111
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 111
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 111 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if112
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 112
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 112 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if113
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 113
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 113 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if114
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 114
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 114 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if115
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 115
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 115 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if116
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 0
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 0 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if117
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 1
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 1 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if118
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 2
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 2 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if119
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 3
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 3 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if120
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 4
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 4 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if121
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 5
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 5 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if122
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 6
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 6 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if123
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 7
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 7 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if124
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 8
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 8 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if125
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 9
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 9 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if126
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 10
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 10 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if127
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 11
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 11 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if128
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 12
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 12 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if129
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 13
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 13 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if130
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 14
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 14 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if131
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 15
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 15 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if132
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 16
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 16 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if133
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 17
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 17 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if134
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 18
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 18 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if135
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 19
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 19 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if136
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 20
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 20 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if137
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 21
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 21 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if138
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 22
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 22 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if139
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 23
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 23 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if140
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 24
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 24 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if141
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 25
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 25 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if142
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 26
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 26 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if143
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 27
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 27 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if144
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 28
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 28 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if145
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 29
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 29 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if146
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 30
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 30 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if147
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 31
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 31 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if148
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 32
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 32 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if149
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 33
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 33 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if150
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 34
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 34 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if151
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 35
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 35 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if152
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 36
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 36 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if153
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 37
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 37 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if154
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 38
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 38 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if155
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 39
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 39 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if156
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 40
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 40 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if157
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 41
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 41 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if158
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 42
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 42 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if159
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 43
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 43 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if160
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 44
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 44 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if161
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 45
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 45 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if162
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 46
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 46 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if163
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 47
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 47 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if164
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 48
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 48 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if165
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 49
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 49 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if166
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 50
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 50 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if167
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 51
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 51 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if168
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 52
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 52 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if169
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 53
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 53 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if170
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 54
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 54 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if171
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 55
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 55 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if172
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 56
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 56 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if173
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 57
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 57 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if174
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 58
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 58 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if175
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 59
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 59 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if176
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 60
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 60 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if177
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 61
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 61 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if178
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 62
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 62 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if179
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 63
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 63 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if180
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 64
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 64 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if181
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 65
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 65 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if182
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 66
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 66 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if183
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 67
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 67 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if184
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 68
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 68 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if185
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 69
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 69 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if186
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 70
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 70 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if187
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 71
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 71 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if188
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 72
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 72 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if189
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 73
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 73 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if190
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 74
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 74 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if191
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 75
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 75 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if192
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 76
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 76 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if193
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 77
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 77 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if194
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 78
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 78 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if195
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 79
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 79 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if196
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 80
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 80 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if197
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 81
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 81 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if198
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 82
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 82 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if199
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 83
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 83 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if200
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 84
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 84 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if201
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 85
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 85 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if202
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 86
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 86 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if203
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 87
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 87 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if204
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 88
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 88 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if205
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 89
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 89 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if206
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 90
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 90 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if207
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 91
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 91 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if208
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 92
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 92 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if209
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 93
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 93 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if210
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 94
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 94 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if211
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 95
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 95 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if212
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 96
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 96 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if213
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 97
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 97 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if214
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 98
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 98 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if215
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 99
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 99 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if216
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 100
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 100 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if217
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 101
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 101 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if218
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 102
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 102 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if219
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 103
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 103 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if220
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 104
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 104 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if221
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 105
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 105 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if222
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 106
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 106 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if223
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 107
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 107 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if224
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 108
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 108 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if225
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 109
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 109 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if226
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 110
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 110 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if227
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 111
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 111 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if228
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 112
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 112 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if229
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 113
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 113 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if230
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 114
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 114 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if231
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 115
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 115 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if232
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 0
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 0 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if233
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 1
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 1 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if234
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 2
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 2 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if235
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 3
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 3 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if236
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 4
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 4 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if237
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 5
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 5 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if238
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 6
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 6 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if239
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 7
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 7 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if240
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 8
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 8 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if241
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 9
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 9 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if242
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 10
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 10 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if243
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 11
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 11 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if244
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 12
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 12 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if245
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 13
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 13 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if246
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 14
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 14 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if247
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 15
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 15 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if248
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 16
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 16 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if249
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 17
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 17 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if250
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 18
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 18 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if251
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 19
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 19 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if252
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 20
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 20 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if253
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 21
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 21 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if254
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 22
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 22 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if255
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 23
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 23 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if256
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 24
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 24 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if257
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 25
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 25 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if258
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 26
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 26 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if259
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 27
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 27 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if260
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 28
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 28 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if261
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 29
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 29 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if262
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 30
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 30 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if263
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 31
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 31 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if264
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 32
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 32 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if265
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 33
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 33 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if266
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 34
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 34 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if267
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 35
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 35 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if268
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 36
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 36 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if269
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 37
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 37 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if270
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 38
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 38 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if271
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 39
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 39 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if272
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 40
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 40 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if273
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 41
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 41 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if274
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 42
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 42 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if275
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 43
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 43 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if276
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 44
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 44 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if277
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 45
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 45 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if278
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 46
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 46 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if279
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 47
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 47 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if280
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 48
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 48 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if281
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 49
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 49 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if282
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 50
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 50 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if283
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 51
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 51 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if284
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 52
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 52 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if285
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 53
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 53 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if286
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 54
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 54 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if287
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 55
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 55 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if288
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 56
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 56 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if289
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 57
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 57 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if290
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 58
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 58 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if291
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 59
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 59 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if292
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 60
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 60 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if293
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 61
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 61 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if294
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 62
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 62 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if295
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 63
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 63 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if296
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 64
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 64 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if297
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 65
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 65 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if298
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 66
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 66 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if299
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 67
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 67 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if300
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 68
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 68 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if301
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 69
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 69 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if302
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 70
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 70 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if303
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 71
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 71 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if304
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 72
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 72 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if305
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 73
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 73 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if306
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 74
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 74 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if307
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 75
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 75 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if308
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 76
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 76 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if309
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 77
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 77 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if310
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 78
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 78 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if311
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 79
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 79 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if312
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 80
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 80 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if313
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 81
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 81 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if314
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 82
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 82 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if315
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 83
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 83 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if316
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 84
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 84 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if317
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 85
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 85 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if318
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 86
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 86 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if319
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 87
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 87 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if320
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 88
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 88 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if321
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 89
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 89 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if322
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 90
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 90 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if323
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 91
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 91 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if324
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 92
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 92 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if325
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 93
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 93 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if326
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 94
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 94 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if327
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 95
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 95 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if328
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 96
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 96 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if329
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 97
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 97 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if330
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 98
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 98 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if331
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 99
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 99 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if332
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 100
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 100 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if333
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 101
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 101 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if334
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 102
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 102 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if335
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 103
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 103 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if336
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 104
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 104 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if337
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 105
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 105 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if338
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 106
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 106 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if339
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 107
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 107 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if340
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 108
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 108 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if341
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 109
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 109 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if342
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 110
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 110 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if343
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 111
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 111 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if344
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 112
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 112 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if345
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 113
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 113 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if346
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 114
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 114 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if347
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 115
scoreboard players operation #limit sandstone_summit_booth.presentation.scroll = #offset sandstone_summit_booth.presentation.scroll
execute if score #limit sandstone_summit_booth.presentation.scroll matches 115 run function sandstone_summit_booth:presentation/slides/autocomplete/15/if348
scoreboard players operation #m sandstone_summit_booth.presentation.autocomplete_mod = #elapsed sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 10
scoreboard players operation #m sandstone_summit_booth.presentation.autocomplete_mod %= #limit sandstone_summit_booth.presentation.scroll
scoreboard players set #limit sandstone_summit_booth.presentation.scroll 5
execute if score #m sandstone_summit_booth.presentation.autocomplete_mod < #limit sandstone_summit_booth.presentation.scroll run function sandstone_summit_booth:presentation/slides/autocomplete/15/if349
execute if score #m sandstone_summit_booth.presentation.autocomplete_mod >= #limit sandstone_summit_booth.presentation.scroll run function sandstone_summit_booth:presentation/slides/autocomplete/15/if350