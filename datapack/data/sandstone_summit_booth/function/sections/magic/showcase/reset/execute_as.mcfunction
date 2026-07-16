execute as @a[tag=sandstone_summit_booth.showcase.in_magic_showcase] run function sandstone_summit_booth:sections/magic/showcase/reset/execute_as/execute_as
execute as @a[tag=sandstone_summit_booth.showcase.player] run function sandstone_summit_booth:sections/magic/showcase/reset/execute_as/execute_as2
kill @e[tag=sandstone_summit_booth.showcase.mob, type=#sandstone_summit_booth:targetable]
kill @e[tag=sandstone_summit_booth.showcase.pedestal]
kill @e[tag=sandstone_summit_booth.showcase.button]
function sandstone_summit_booth:sections/magic/showcase/door/open
scoreboard players set #global sandstone_summit_booth.showcase.state 0