scoreboard players set #lb1 sandstone_summit_booth.rhythm.state 0
tag @a remove ssb.lb.r1
scoreboard players set #lb2 sandstone_summit_booth.rhythm.state 0
tag @a remove ssb.lb.r2
scoreboard players set #lb3 sandstone_summit_booth.rhythm.state 0
tag @a remove ssb.lb.r3
scoreboard players set #lb4 sandstone_summit_booth.rhythm.state 0
tag @a remove ssb.lb.r4
scoreboard players set #lb5 sandstone_summit_booth.rhythm.state 0
tag @a remove ssb.lb.r5
scoreboard players set #lb6 sandstone_summit_booth.rhythm.state 0
tag @a remove ssb.lb.r6
scoreboard players set #lb7 sandstone_summit_booth.rhythm.state 0
tag @a remove ssb.lb.r7
scoreboard players set #lb8 sandstone_summit_booth.rhythm.state 0
tag @a remove ssb.lb.r8
scoreboard players set #lb9 sandstone_summit_booth.rhythm.state 0
tag @a remove ssb.lb.r9
scoreboard players set #lb10 sandstone_summit_booth.rhythm.state 0
tag @a remove ssb.lb.r10
execute if score $lb_song sandstone_summit_booth.rhythm.state matches 0 run function sandstone_summit_booth:sections/rhythm/leaderboard/sort/if/if
execute if score $lb_song sandstone_summit_booth.rhythm.state matches 1 run function sandstone_summit_booth:sections/rhythm/leaderboard/sort/if2/if
execute if score $lb_song sandstone_summit_booth.rhythm.state matches 2 run function sandstone_summit_booth:sections/rhythm/leaderboard/sort/if3/if