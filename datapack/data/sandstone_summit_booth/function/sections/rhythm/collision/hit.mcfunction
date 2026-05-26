scoreboard players remove @s sandstone_summit_booth.ssb_wliv 1
tag @s add ssb.hit_tick
tp @s ~ ~5 ~
playsound minecraft:entity.player.hurt master @s
tag @s add ssb.wall.cd
scoreboard players set @s sandstone_summit_booth.ssb_wcd 30
execute if score @s sandstone_summit_booth.ssb_wliv matches ..0 run function sandstone_summit_booth:sections/rhythm/collision/hit/if