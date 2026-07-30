execute as @a[x=-80, y=63, z=21, dx=20, dy=9, dz=30] run tp @s -69.5 64 53 180 0
kill @e[tag=sandstone_summit_booth.showcase.placeholder]
function sandstone_summit_booth:sections/main/showcase/cycle/switch3
fill -80 63 21 -60 72 51 minecraft:air strict
function sandstone_summit_booth:sections/magic/setup
scoreboard players set main.showcase.current_0_WnYlBycD __sandstone 2
scoreboard players set main.showcase.idle_ticks_0_WnYlBycD __sandstone 0
kill @e[tag=sandstone_summit_booth.showcase.info_panel]
summon minecraft:text_display -53.998999999999995 65.251 56.95 {Tags:['sandstone_summit_booth.showcase.info_panel','summit.booth_entity.sandstone_summit_booth','summit.static'],text:[{text:'❔ ABOUT THIS SHOWCASE',color:'white',bold:true},{text:'\n\n'},{text:'This showcase is simpler, but\nshows how object-oriented\npatterns (classes, inheritance, factories)\ncan make Minecraft datapack\ndevelopment simpler',color:'white',bold:false}],alignment:'center',billboard:'fixed',Rotation:[180f,0f],background:1409286144i,line_width:300i,text_opacity:-1b,shadow:true,see_through:false}