summon minecraft:block_display 3 68 30 {Tags:['ssb.wall','ssb.wall.new','ssb.parkour'],block_state:{Name:'minecraft:magenta_stained_glass'},interpolation_duration:80i,transformation:{translation:[-0.5f,0f,-0.5f],left_rotation:[0f,0f,0f,1f],scale:[1f,1f,2f],right_rotation:[0f,0f,0f,1f]}}
summon minecraft:happy_ghast 3 68 30 {Tags:['ssb.wall','ssb.wall.hit','ssb.wall.new','ssb.wall.ghast','ssb.parkour','ssb.pk.fresh'],NoAI:1b,NoGravity:1b,Invulnerable:1b,Silent:1b,attributes:[{id:'minecraft:scale',base:0.25d}]}
scoreboard players set @e[tag=ssb.pk.fresh, limit=1, sort=nearest] sandstone_summit_booth.ssb_wage 3
tag @e[tag=ssb.pk.fresh] remove ssb.pk.fresh
summon minecraft:happy_ghast 3 68 30 {Tags:['ssb.wall','ssb.wall.hit','ssb.wall.new','ssb.wall.ghast','ssb.parkour','ssb.pk.fresh','ssb.pk.trigger'],NoAI:1b,NoGravity:1b,Invulnerable:1b,Silent:1b,attributes:[{id:'minecraft:scale',base:0.25d}]}
scoreboard players set @e[tag=ssb.pk.fresh, limit=1, sort=nearest] sandstone_summit_booth.ssb_wage 1
tag @e[tag=ssb.pk.fresh] remove ssb.pk.fresh