effect clear @s
title @s actionbar {"text":"You died! Better luck next time.","color":"red"}
tp @s -70 64 55
function sandstone_summit_booth:sections/rhythm/end/run
schedule function sandstone_summit_booth:sections/rhythm/collision/death_sound 1t replace