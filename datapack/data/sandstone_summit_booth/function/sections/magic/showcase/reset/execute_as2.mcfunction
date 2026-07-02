kill @e[tag=sandstone_summit_booth.showcase.mob, type=#sandstone_summit_booth:targetable]
kill @e[tag=sandstone_summit_booth.showcase.pedestal]
kill @e[tag=sandstone_summit_booth.showcase.button]
function sandstone_summit_booth:sections/magic/showcase/door/open
scoreboard players set #global sandstone_summit_booth.showcase.state 0