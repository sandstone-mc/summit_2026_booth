scoreboard players set $max sandstone_summit_booth.ssb_mc 50
execute as @a[tag=ssb.player] run function sandstone_summit_booth:sections/rythm/scoring/compute/execute_as
title @a[tag=ssb.player] times 10 60 20
title @a[tag=ssb.player] title {"text":"Game Over!","color":"red","bold":true}
execute as @a[tag=ssb.player] run title @s subtitle [{"text":"Score: ","color":"gray"},{"score":{"name":"@s","objective":"sandstone_summit_booth.ssb_scr"}}]