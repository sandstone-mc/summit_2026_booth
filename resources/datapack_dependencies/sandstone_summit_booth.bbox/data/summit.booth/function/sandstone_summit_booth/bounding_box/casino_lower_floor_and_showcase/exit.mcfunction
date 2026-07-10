advancement revoke @s only summit.booth:sandstone_summit_booth/bounding_box/casino_lower_floor_and_showcase/enter
execute unless predicate summit.booth:sandstone_summit_booth/in_booth run function summit.booth:sandstone_summit_booth/exit
execute unless entity @a[predicate=summit.booth:sandstone_summit_booth/in_booth,limit=1] run function summit.booth:sandstone_summit_booth/ticking_functions/clear

