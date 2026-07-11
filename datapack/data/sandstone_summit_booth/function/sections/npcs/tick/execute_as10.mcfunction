tag @a[tag=sandstone_summit_booth.npc.glitchy.interactor] remove sandstone_summit_booth.npc.glitchy.interactor
tag @s add sandstone_summit_booth.npc.glitchy.interactor
advancement revoke @s only sandstone_summit_booth:npcs/interact/glitchy
execute as @e[tag=sandstone_summit_booth.npc.glitchy, type=minecraft:mannequin] run function sandstone_summit_booth:sections/npcs/tick/execute_as10/execute_as/if