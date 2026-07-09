function sandstone_summit_booth:sections/rhythm/wall/init
execute as @e[tag=ssb.rhythm.wall, tag=ssb.rhythm.wall.init, tag=!ssb.rhythm.parkour] run scoreboard players operation @s sandstone_summit_booth.rhythm.wall.depth = anon_WnYlBycD_39 __sandstone
execute as @e[tag=ssb.rhythm.wall, tag=ssb.rhythm.wall.init] run function sandstone_summit_booth:sections/rhythm/wall/tick/if/execute_as2
execute as @e[tag=ssb.rhythm.wall.wait] run function sandstone_summit_booth:sections/rhythm/wall/tick/if/execute_as3
execute as @e[tag=ssb.rhythm.wall.new] run function sandstone_summit_booth:sections/rhythm/wall/tick/if/execute_as4
function sandstone_summit_booth:sections/rhythm/wall/move
execute as @e[tag=ssb.rhythm.wall, tag=!ssb.rhythm.wall.init, tag=!ssb.rhythm.wall.wait] run scoreboard players add @s sandstone_summit_booth.rhythm.wall.age 1
execute if entity @e[scores={sandstone_summit_booth.rhythm.wall.age=42..42}, tag=ssb.rhythm.wall] run scoreboard players set anon_WnYlBycD_11 __sandstone 1
execute as @e[scores={sandstone_summit_booth.rhythm.wall.age=76..76}, tag=ssb.rhythm.wall] run tp @s -70 -64 54
kill @e[scores={sandstone_summit_booth.rhythm.wall.age=77..}, tag=ssb.rhythm.wall]