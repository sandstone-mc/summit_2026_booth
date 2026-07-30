function sandstone_summit_booth:sections/main/showcase/ui/spawn_button
function sandstone_summit_booth:sections/rhythm/settings/spawn
kill @e[tag=sandstone_summit_booth.showcase.info_panel]
summon minecraft:text_display -53.998999999999995 65.251 56.95 {Tags:['sandstone_summit_booth.showcase.info_panel','summit.booth_entity.sandstone_summit_booth','summit.static'],text:{text:' '},alignment:'center',billboard:'fixed',Rotation:[180f,0f],background:1409286144i,line_width:300i,text_opacity:-1b,shadow:true,see_through:false}