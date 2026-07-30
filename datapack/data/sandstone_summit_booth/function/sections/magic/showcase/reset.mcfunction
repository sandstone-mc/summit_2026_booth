scoreboard players set #global sandstone_summit_booth.showcase.state 5
execute as @e[type=minecraft:marker, tag=sandstone_summit_booth.showcase.marker] at @s run function sandstone_summit_booth:sections/magic/showcase/reset/execute_as
schedule clear sandstone_summit_booth:sections/magic/tick/school/fire
schedule clear sandstone_summit_booth:sections/magic/tick/school/ice
schedule clear sandstone_summit_booth:sections/magic/tick/school/arcane
schedule clear sandstone_summit_booth:sections/magic/tick/school/lightning
schedule clear sandstone_summit_booth:sections/magic/tick/school/nature
function sandstone_summit_booth:sections/main/showcase/session/end