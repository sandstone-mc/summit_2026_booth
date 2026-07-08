tag @s add sandstone_summit_booth.spell.nature.thorn_volley.projectile
scoreboard players set @s sandstone_summit_booth.lifetime 30
data modify entity @s data.owner set from entity @n[tag=sandstone_summit_booth.spell.caster] UUID
rotate @s ~ ~
tp @s ~ ~1.6 ~