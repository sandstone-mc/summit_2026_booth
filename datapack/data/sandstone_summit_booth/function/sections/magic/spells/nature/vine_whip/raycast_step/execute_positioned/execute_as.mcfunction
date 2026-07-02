damage @s 1
rotate @s facing entity @a[tag=sandstone_summit_booth.spell.nature.vine_whip.caster,limit=1] eyes
scoreboard players set $strength player_motion.api.launch 15000
return run function player_motion:api/launch_looking