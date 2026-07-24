execute as @a[tag=sandstone_summit_booth.showcase.in_magic_showcase, tag=sandstone_summit_booth.showcase.in_magic_showcase] run function sandstone_summit_booth:sections/magic/showcase/reset/execute_as/execute_positioned/execute_as
execute as @a[tag=sandstone_summit_booth.showcase.player, tag=sandstone_summit_booth.showcase.player] run function sandstone_summit_booth:sections/magic/showcase/reset/execute_as/execute_positioned/execute_as2
kill @e[type=#sandstone_summit_booth:targetable, tag=sandstone_summit_booth.showcase.mob, tag=sandstone_summit_booth.showcase.mob]
kill @e[tag=sandstone_summit_booth.showcase.pedestal, tag=sandstone_summit_booth.showcase.pedestal]
kill @e[tag=sandstone_summit_booth.showcase.button, tag=sandstone_summit_booth.showcase.button]
scoreboard players set #global sandstone_summit_booth.showcase.state 0