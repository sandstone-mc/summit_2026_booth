tag @s add sandstone_summit_booth.spell.caster
execute summon minecraft:marker run function sandstone_summit_booth:sections/magic/spells/nature/thorn_volley/spawn/execute_anchored/execute_summon
execute summon minecraft:marker run function sandstone_summit_booth:sections/magic/spells/nature/thorn_volley/spawn/execute_anchored/execute_summon2
execute summon minecraft:marker run function sandstone_summit_booth:sections/magic/spells/nature/thorn_volley/spawn/execute_anchored/execute_summon3
execute summon minecraft:marker run function sandstone_summit_booth:sections/magic/spells/nature/thorn_volley/spawn/execute_anchored/execute_summon4
execute summon minecraft:marker run function sandstone_summit_booth:sections/magic/spells/nature/thorn_volley/spawn/execute_anchored/execute_summon5
execute as @e[tag=sandstone_summit_booth.spell.nature.thorn_volley.projectile, distance=0..1] run function sandstone_summit_booth:sections/magic/spells/nature/thorn_volley/spawn/execute_anchored/execute_as
tag @s remove sandstone_summit_booth.spell.caster