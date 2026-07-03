clear @s minecraft:stick[custom_data~{'sandstone_summit_booth.id':'magic_wand'}]
kill @e[tag=sandstone_summit_booth.showcase.mob, type=#sandstone_summit_booth:targetable]
kill @e[tag=sandstone_summit_booth.showcase.pedestal]
return run function sandstone_summit_booth:sections/magic/showcase/selection/start