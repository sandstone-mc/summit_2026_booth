clear @s minecraft:stick[custom_data~{'sandstone_summit_booth.id':'magic_wand'}]
kill @e[type=#sandstone_summit_booth:targetable, tag=sandstone_summit_booth.showcase.mob, tag=sandstone_summit_booth.showcase.mob]
kill @e[tag=sandstone_summit_booth.showcase.pedestal, tag=sandstone_summit_booth.showcase.pedestal]
kill @e[tag=sandstone_summit_booth.showcase.button.change_school, tag=sandstone_summit_booth.showcase.button.change_school]
return run function sandstone_summit_booth:sections/magic/showcase/selection/start