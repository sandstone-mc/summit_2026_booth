tag @a[tag=sandstone_summit_booth.npc.credits.interactor] remove sandstone_summit_booth.npc.credits.interactor
tag @s add sandstone_summit_booth.npc.credits.interactor
advancement revoke @s only sandstone_summit_booth:npcs/interact/credits
execute as @e[tag=sandstone_summit_booth.npc.credits, type=minecraft:mannequin] run function sandstone_summit_booth:sections/npcs/tick/execute_as7/execute_as/if