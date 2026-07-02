tag @s add sandstone_summit_booth.spell.ice.frostbolt.projectile
tp @s ~ ~1 ~ ~ ~
scoreboard players set @s sandstone_summit_booth.lifetime 50
data modify entity @s data.owner set from entity @n[tag=sandstone_summit_booth.spell.caster] UUID