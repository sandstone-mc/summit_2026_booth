execute as @e[tag=ssb.ui.lb.si, type=minecraft:interaction] at @s if data entity @s attack run function sandstone_summit_booth:sections/rhythm/leaderboard/tick/execute_as
execute as @e[tag=ssb.ui.lb.ci, type=minecraft:interaction] at @s if data entity @s attack run function sandstone_summit_booth:sections/rhythm/leaderboard/tick/execute_as2
execute as @a[advancements={sandstone_summit_booth:ui_lb_song=true}] run function sandstone_summit_booth:sections/rhythm/leaderboard/tick/execute_as3
execute as @a[advancements={sandstone_summit_booth:ui_lb_cat=true}] run function sandstone_summit_booth:sections/rhythm/leaderboard/tick/execute_as4
execute as @a[advancements={sandstone_summit_booth:ui_lb_my=true}] run function sandstone_summit_booth:sections/rhythm/leaderboard/tick/execute_as5