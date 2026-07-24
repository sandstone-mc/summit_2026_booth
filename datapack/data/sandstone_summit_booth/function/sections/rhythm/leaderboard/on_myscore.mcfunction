function sandstone_summit_booth:sections/rhythm/leaderboard/on_myscore/switch
data merge entity @e[tag=snd.ui.lb.you, limit=1] {text:[{text:'  You: ',color:'green'},{score:{name:'anon_WnYlBycD_37',objective:'__sandstone'}},{text:' | #',color:'gray'},{score:{name:'anon_WnYlBycD_38',objective:'__sandstone'}},{text:'  '}]}
execute at @s run playsound minecraft:entity.player.levelup master @s
advancement revoke @s only sandstone_summit_booth:ui_lb_my