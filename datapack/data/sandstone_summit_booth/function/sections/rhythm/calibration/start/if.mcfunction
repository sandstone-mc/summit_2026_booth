scoreboard players set anon_WnYlBycD_2 __sandstone 4
tag @s add ssb.rhythm.cal.player
tp @s -70 64 54 180 0
scoreboard players set anon_WnYlBycD_12 __sandstone 0
scoreboard players set anon_WnYlBycD_13 __sandstone 0
scoreboard players set anon_WnYlBycD_15 __sandstone 0
scoreboard players set anon_WnYlBycD_14 __sandstone 28
summon minecraft:interaction -70 64 51.5 {Tags:['summit.booth_entity.sandstone_summit_booth','summit.dynamic','ssb.rhythm.cal.pad'],width:1.5f,height:1.5f,response:true}
summon minecraft:text_display -70 64 51.5 {Tags:['summit.booth_entity.sandstone_summit_booth','summit.dynamic','ssb.rhythm.cal.pad'],text:[{text:'⧗\n',color:'aqua'},{text:'TAP',color:'white',bold:true}],billboard:'fixed',Rotation:[0f,0f],background:1409286144i,see_through:false,transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[3f,3f,3f]}}
tellraw @s [{"text":"⧗ ","color":"aqua"},{"text":"Tap the pad on every ","color":"gray"},{"text":"high click.","color":"aqua"},{"text":"Four low count-in clicks first.","color":"gray"}]
function sandstone_summit_booth:sections/rhythm/settings/update
schedule function sandstone_summit_booth:sections/rhythm/calibration/beat 16t replace