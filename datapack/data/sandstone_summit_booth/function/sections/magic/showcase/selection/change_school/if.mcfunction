clear @s minecraft:stick[custom_data~{'sandstone_summit_booth.id':'magic_wand'}]
kill @e[type=#sandstone_summit_booth:targetable, tag=sandstone_summit_booth.showcase.mob]
kill @e[tag=sandstone_summit_booth.showcase.pedestal]
kill @e[tag=sandstone_summit_booth.showcase.button.change_school]
schedule clear sandstone_summit_booth:sections/magic/tick/school/fire
schedule clear sandstone_summit_booth:sections/magic/tick/school/ice
schedule clear sandstone_summit_booth:sections/magic/tick/school/arcane
schedule clear sandstone_summit_booth:sections/magic/tick/school/lightning
schedule clear sandstone_summit_booth:sections/magic/tick/school/nature
return run function sandstone_summit_booth:sections/magic/showcase/selection/start