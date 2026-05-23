function sandstone_summit_booth:sections/rythm/wall/init
execute as @e[tag=ssb.wall, tag=ssb.wall.init] run function sandstone_summit_booth:sections/rythm/wall/tick/if/execute_in/execute_as
execute as @e[tag=ssb.wall.wait] run function sandstone_summit_booth:sections/rythm/wall/tick/if/execute_in/execute_as2
execute as @e[tag=ssb.wall.new] run function sandstone_summit_booth:sections/rythm/wall/tick/if/execute_in/execute_as3
function sandstone_summit_booth:sections/rythm/wall/move
execute as @e[tag=ssb.wall, tag=!ssb.wall.init, tag=!ssb.wall.wait] run scoreboard players add @s sandstone_summit_booth.ssb_wage 1
execute if entity @e[scores={sandstone_summit_booth.ssb_wage=60..60}, tag=ssb.wall] run scoreboard players set $beat sandstone_summit_booth.ssb_bf 1
execute as @e[scores={sandstone_summit_booth.ssb_wage=100..100}, tag=ssb.wall] run tp @s 0 -10 0
kill @e[scores={sandstone_summit_booth.ssb_wage=102..}, tag=ssb.wall]