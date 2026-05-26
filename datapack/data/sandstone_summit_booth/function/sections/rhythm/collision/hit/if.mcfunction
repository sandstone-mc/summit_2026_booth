tag @s remove ssb.alive
tag @s remove ssb.player
effect clear @s
title @s actionbar {"text":"You died! Better luck next time.","color":"red"}
playsound minecraft:entity.player.hurt master @s ~ ~ ~ 1 0.5
execute in minecraft:overworld run tp @s -118 72 -30
gamemode adventure @s