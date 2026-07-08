particle electric_spark ~ ~1 ~ 0.5 0.8 0.5 0.05 2 force
particle end_rod ~ ~1.6 ~ 0.2 0.5 0.2 0.1 20 force
scoreboard players remove @s sandstone_summit_booth.status.static_field_timer 10
execute if score @s sandstone_summit_booth.status.static_field_timer matches ..0 run function sandstone_summit_booth:sections/magic/spells/lightning/static_field/update/execute_as/if
execute positioned ~-2 ~-1.5 ~-2 run function sandstone_summit_booth:sections/magic/spells/lightning/static_field/update/execute_as/execute_positioned