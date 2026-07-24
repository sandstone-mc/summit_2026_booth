advancement revoke @s only sandstone_summit_booth:sections/presentation/menu/start_button
function sandstone_summit_booth:sections/presentation/mount
summon item_display -82.26 89.5 42.002 {item:{id:'paper',count:1i,components:{"minecraft:item_model":'sandstone_summit_booth:presentation/small_logo'}},transformation:{scale:[1.15f,0.65f,0.25f],translation:[0f,0f,0f],left_rotation:[0f,1f,0f,0f],right_rotation:[0f,0f,0f,1f]},brightness:{sky:15i,block:15i},Tags:['summit.booth_entity.sandstone_summit_booth','sandstone_summit_booth.presentation.menu.small_logo']}
kill @e[tag=sandstone_summit_booth.presentation.menu.screen_saver]
kill @e[tag=sandstone_summit_booth.sections.presentation.menu.start_text]
kill @e[tag=sandstone_summit_booth.sections.presentation.menu.start_button]
function sandstone_summit_booth:sections/presentation/menu/spawn_1