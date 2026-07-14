execute if score main.showcase.change_cooldown_0_WnYlBycD __sandstone matches 1.. run scoreboard players remove main.showcase.change_cooldown_0_WnYlBycD __sandstone 1
execute if score main.showcase.current_0_WnYlBycD __sandstone matches 0 run return run scoreboard players set main.showcase.idle_ticks_0_WnYlBycD __sandstone 0
execute if score main.showcase.active_0_WnYlBycD __sandstone matches 1 run return run scoreboard players set main.showcase.idle_ticks_0_WnYlBycD __sandstone 0
scoreboard players add main.showcase.idle_ticks_0_WnYlBycD __sandstone 1
execute if score main.showcase.idle_ticks_0_WnYlBycD __sandstone matches 12000.. run function sandstone_summit_booth:sections/main/showcase/swap_to_placeholder