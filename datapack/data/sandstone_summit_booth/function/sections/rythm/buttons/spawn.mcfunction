kill @e[tag=ssb.btn.cycle]
kill @e[tag=ssb.btn.start]
kill @e[tag=ssb.btn.cycle_display]
kill @e[tag=ssb.btn.start_display]
summon minecraft:interaction -120 73 -30 {Tags:['ssb.btn.cycle'],width:1f,height:1f}
summon minecraft:interaction -116 73 -30 {Tags:['ssb.btn.start'],width:1f,height:1f}
summon minecraft:text_display -120 74.5 -30 {Tags:['ssb.btn.cycle_display'],text:{text:'Song Select',color:'aqua',bold:true},billboard:'center',view_range:0.5f}
summon minecraft:text_display -116 74.5 -30 {Tags:['ssb.btn.start_display'],text:{text:'Start Game',color:'green',bold:true},billboard:'center',view_range:0.5f}