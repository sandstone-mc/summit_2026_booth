tag @s remove ssb.rhythm.alive
effect clear @s
title @s actionbar {"text":"You died! Better luck next time.","color":"red"}
playsound minecraft:entity.player.hurt master @s ~ ~ ~ 1 0.5
execute in minecraft:overworld run tp @s -70 64 55
gamemode adventure @s