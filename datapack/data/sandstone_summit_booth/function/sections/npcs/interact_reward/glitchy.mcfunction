tag @a[tag=sandstone_summit_booth.npc.glitchy.interactor] remove sandstone_summit_booth.npc.glitchy.interactor
tag @s add sandstone_summit_booth.npc.glitchy.interactor
execute as @e[type=minecraft:mannequin, tag=sandstone_summit_booth.npc.glitchy] run function sandstone_summit_booth:sections/npcs/interact_reward/glitchy/execute_as