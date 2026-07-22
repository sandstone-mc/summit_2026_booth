scoreboard players operation anon_WnYlBycD_79 __sandstone = @s sandstone_summit_booth.lifetime
scoreboard players operation anon_WnYlBycD_79 __sandstone %= 10 __sandstone
function sandstone_summit_booth:sections/magic/spells/lightning/ball_lightning/update/execute_as/if
tp @s ^ ^ ^0.1
scoreboard players remove @s sandstone_summit_booth.lifetime 1
execute if score @s sandstone_summit_booth.lifetime matches ..0 run function sandstone_summit_booth:sections/magic/spells/lightning/ball_lightning/update/execute_as/if2
execute positioned ~-0.1 ~-0.05 ~-0.1 run function sandstone_summit_booth:sections/magic/spells/lightning/ball_lightning/update/execute_as/execute_positioned
execute unless block ~ ~ ~ #minecraft:replaceable run function sandstone_summit_booth:sections/magic/spells/lightning/ball_lightning/update/execute_as/execute_unless