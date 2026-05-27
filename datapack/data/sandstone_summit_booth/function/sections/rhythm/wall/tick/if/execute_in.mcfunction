function sandstone_summit_booth:sections/rhythm/wall/init
execute as @e[tag=ssb.rhythm.wall, tag=ssb.rhythm.wall.init] run function sandstone_summit_booth:sections/rhythm/wall/tick/if/execute_in/execute_as
execute as @e[tag=ssb.rhythm.wall.wait] run function sandstone_summit_booth:sections/rhythm/wall/tick/if/execute_in/execute_as2
execute as @e[tag=ssb.rhythm.wall.new] run function sandstone_summit_booth:sections/rhythm/wall/tick/if/execute_in/execute_as3
function sandstone_summit_booth:sections/rhythm/wall/move
execute as @e[tag=ssb.rhythm.wall, tag=!ssb.rhythm.wall.init, tag=!ssb.rhythm.wall.wait] run scoreboard players add @s sandstone_summit_booth.rhythm.wall.age 1
execute if entity @e[scores={sandstone_summit_booth.rhythm.wall.age=60..60}, tag=ssb.rhythm.wall] run scoreboard players set $beat_flag sandstone_summit_booth.rhythm.state 1
execute as @e[scores={sandstone_summit_booth.rhythm.wall.age=100..100}, tag=ssb.rhythm.wall] run tp @s 0 -10 0
kill @e[scores={sandstone_summit_booth.rhythm.wall.age=102..}, tag=ssb.rhythm.wall]