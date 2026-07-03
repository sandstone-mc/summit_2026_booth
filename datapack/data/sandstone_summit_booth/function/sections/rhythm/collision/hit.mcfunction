scoreboard players remove @s sandstone_summit_booth.rhythm.wall.lives 1
tag @s add ssb.rhythm.hit_tick
function sandstone_summit_booth:sections/rhythm/collision/break_wall
playsound minecraft:entity.player.hurt master @s
tag @s add ssb.rhythm.wall.cd
scoreboard players set @s sandstone_summit_booth.rhythm.wall.hit_cooldown 30
effect give @s minecraft:invisibility 1 0 true
execute if score @s sandstone_summit_booth.rhythm.wall.lives matches ..0 run function sandstone_summit_booth:sections/rhythm/collision/hit/if