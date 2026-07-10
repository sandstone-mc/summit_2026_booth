advancement revoke @s only summit.booth:sandstone_summit_booth/bounding_box/side_stairs/exit
execute if entity @s[tag=!summit.in_booth.sandstone_summit_booth] run function summit.booth:sandstone_summit_booth/enter
execute unless score #sandstone_summit_booth summit.ticked_functions_active matches 1 run function summit.booth:sandstone_summit_booth/ticking_functions/schedule

