function sandstone_summit_booth:sections/rhythm/wall/init
execute as @e[tag=snd.rhythm.wall, tag=snd.rhythm.wall.init, tag=!snd.rhythm.parkour] run scoreboard players operation @s sandstone_summit_booth.rhythm.wall.depth = anon_WnYlBycD_44 __sandstone
execute as @e[tag=snd.rhythm.wall, tag=snd.rhythm.wall.init] run function sandstone_summit_booth:sections/rhythm/wall/tick/if/execute_as2
execute as @e[tag=snd.rhythm.wall.wait] run function sandstone_summit_booth:sections/rhythm/wall/tick/if/execute_as3
execute as @e[tag=snd.rhythm.wall.new] run function sandstone_summit_booth:sections/rhythm/wall/tick/if/execute_as4
function sandstone_summit_booth:sections/rhythm/wall/move
execute as @e[tag=snd.rhythm.wall, tag=!snd.rhythm.wall.init, tag=!snd.rhythm.wall.wait] run scoreboard players add @s sandstone_summit_booth.rhythm.wall.age 1
execute if entity @e[scores={sandstone_summit_booth.rhythm.wall.age=42..42}, tag=snd.rhythm.wall] run scoreboard players set anon_WnYlBycD_16 __sandstone 1
execute as @e[scores={sandstone_summit_booth.rhythm.wall.age=76..76}, tag=snd.rhythm.wall] run tp @s -70 -64 54
kill @e[scores={sandstone_summit_booth.rhythm.wall.age=77..}, tag=snd.rhythm.wall]