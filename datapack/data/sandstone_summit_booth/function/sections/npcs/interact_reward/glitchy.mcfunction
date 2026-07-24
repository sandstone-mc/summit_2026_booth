tag @a[tag=sandstone_summit_booth.npc.glitchy.interactor] remove sandstone_summit_booth.npc.glitchy.interactor
tag @s add sandstone_summit_booth.npc.glitchy.interactor
advancement revoke @s only sandstone_summit_booth:npcs/interact/glitchy
execute as @e[type=minecraft:mannequin, tag=sandstone_summit_booth.npc.glitchy] run function sandstone_summit_booth:sections/npcs/interact_reward/glitchy/execute_as