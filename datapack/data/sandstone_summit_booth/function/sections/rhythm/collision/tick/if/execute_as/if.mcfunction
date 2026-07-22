execute if score @s sandstone_summit_booth.rhythm.wall.hit_cooldown matches ..0 run return run function sandstone_summit_booth:sections/rhythm/collision/tick/if/execute_as/if/0_if/return_run
scoreboard players operation @s sandstone_summit_booth.snd.flash_phase = @s sandstone_summit_booth.rhythm.wall.hit_cooldown
scoreboard players operation @s sandstone_summit_booth.snd.flash_phase %= 6 __sandstone
function sandstone_summit_booth:sections/rhythm/collision/tick/if/execute_as/if/if