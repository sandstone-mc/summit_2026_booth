execute unless entity @a[tag=sandstone_summit_booth.showcase.player] run function sandstone_summit_booth:sections/magic/showcase/reset
scoreboard players set #in_booth_count sandstone_summit_booth.showcase.state 0
execute as @a[tag=sandstone_summit_booth.showcase.in_magic_showcase] run scoreboard players add #in_booth_count sandstone_summit_booth.showcase.state 1
execute if score #in_booth_count sandstone_summit_booth.showcase.state matches 2.. run function sandstone_summit_booth:sections/magic/showcase/reset
execute if entity @a[tag=sandstone_summit_booth.showcase.player, tag=!sandstone_summit_booth.showcase.in_magic_showcase] run function sandstone_summit_booth:sections/magic/showcase/reset