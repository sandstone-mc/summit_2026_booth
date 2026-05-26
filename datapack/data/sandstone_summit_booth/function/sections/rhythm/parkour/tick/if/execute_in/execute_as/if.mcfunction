scoreboard players add @s sandstone_summit_booth.ssb_wliv 1
scoreboard players add @s sandstone_summit_booth.rhythm.points 15
execute if score @s sandstone_summit_booth.rhythm.combo matches ..9 run scoreboard players set @s sandstone_summit_booth.rhythm.combo 10
tag @s add ssb.wall.cd
scoreboard players set @s sandstone_summit_booth.ssb_wcd 60
playsound minecraft:entity.player.levelup master @s
title @s title {"text":""}
title @s subtitle [{"text":"Parkour Complete! ","color":"green"},{"text":"+1❤ ","color":"red"},{"text":"+15pts ","color":"aqua"},{"text":"+Immunity!","color":"light_purple"}]
tag @s add ssb.pk.done