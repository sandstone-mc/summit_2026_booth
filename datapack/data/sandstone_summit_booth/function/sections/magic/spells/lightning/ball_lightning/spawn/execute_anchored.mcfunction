tag @s add sandstone_summit_booth.spell.caster
execute summon minecraft:marker run function sandstone_summit_booth:sections/magic/spells/lightning/ball_lightning/spawn/execute_anchored/execute_summon
execute as @e[tag=sandstone_summit_booth.spell.lightning.ball_lightning.projectile, distance=0..1] run function sandstone_summit_booth:sections/magic/spells/lightning/ball_lightning/spawn/execute_anchored/execute_as
tag @s remove sandstone_summit_booth.spell.caster