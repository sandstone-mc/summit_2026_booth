execute unless entity @a[tag=sandstone_summit_booth.showcase.player] run function sandstone_summit_booth:sections/magic/showcase/reset
scoreboard players set #in_booth_count sandstone_summit_booth.showcase.state 0
execute as @a[tag=sandstone_summit_booth.showcase.in_magic_showcase] run scoreboard players add #in_booth_count sandstone_summit_booth.showcase.state 1
execute if score #in_booth_count sandstone_summit_booth.showcase.state matches 2.. run function sandstone_summit_booth:sections/magic/showcase/reset
execute unless entity @a[tag=sandstone_summit_booth.showcase.player, x=-80, y=63, z=21, dx=20, dy=9, dz=30] run function sandstone_summit_booth:sections/magic/showcase/reset
scoreboard players remove #session_timer sandstone_summit_booth.showcase.state 1
execute if score #session_timer sandstone_summit_booth.showcase.state matches ..0 run function sandstone_summit_booth:sections/magic/showcase/reset