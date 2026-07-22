scoreboard players add @s sandstone_summit_booth.rhythm.wall.lives 1
scoreboard players add @s sandstone_summit_booth.rhythm.points 15
execute if score @s sandstone_summit_booth.rhythm.combo matches ..9 run scoreboard players set @s sandstone_summit_booth.rhythm.combo 10
tag @s add snd.rhythm.wall.cd
scoreboard players set @s sandstone_summit_booth.rhythm.wall.hit_cooldown 61
playsound minecraft:entity.player.levelup master @s
title @s title {"text":""}
title @s subtitle [{"text":"Parkour Complete! ","color":"green"},{"text":"+1❤ ","color":"red"},{"text":"+15pts ","color":"aqua"},{"text":"+Immunity!","color":"light_purple"}]
scoreboard players set anon_WnYlBycD_22 __sandstone 1