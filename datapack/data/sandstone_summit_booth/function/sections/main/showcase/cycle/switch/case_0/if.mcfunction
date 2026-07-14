execute as @a[x=-80, y=63, z=21, dx=20, dy=9, dz=30] run tp @s -69.5 64 53 180 0
function sandstone_summit_booth:sections/main/showcase/cycle/switch2
fill -80 63 21 -60 72 51 minecraft:air strict
function sandstone_summit_booth:sections/rhythm/setup
scoreboard players set main.showcase.current_0_WnYlBycD __sandstone 1
scoreboard players set main.showcase.idle_ticks_0_WnYlBycD __sandstone 0