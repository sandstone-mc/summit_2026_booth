particle electric_spark ~ ~ ~ 1 1 1 0.2 50 force @a[distance=0..24]
execute positioned ~-6 ~-3 ~-6 run function sandstone_summit_booth:sections/magic/spells/lightning/ball_lightning/update/execute_as/execute_unless/execute_positioned
kill @s