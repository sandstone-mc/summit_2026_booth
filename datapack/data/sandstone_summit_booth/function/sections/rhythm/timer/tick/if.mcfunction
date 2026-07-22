execute unless entity @a[tag=snd.rhythm.player] run function sandstone_summit_booth:sections/rhythm/end/run
scoreboard players remove anon_WnYlBycD_40 __sandstone 1
execute if score anon_WnYlBycD_40 __sandstone matches ..0 unless entity @e[tag=snd.rhythm.wall] run function sandstone_summit_booth:sections/rhythm/end/run