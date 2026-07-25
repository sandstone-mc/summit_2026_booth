function sandstone_summit_booth:sections/rhythm/leaderboard/on_myscore/switch
$data merge entity @e[type=minecraft:text_display, tag=snd.ui.lb.you, limit=1] {text:[{text:'  You: ',color:'green'},$(undefined),{text:' | #',color:'gray'},$(undefined),{text:'  '}]}
execute at @s run playsound minecraft:entity.player.levelup master @s
advancement revoke @s only sandstone_summit_booth:ui_lb_my