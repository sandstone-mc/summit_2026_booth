tag @a[tag=sandstone_summit_booth.npc.secret_glitch.interactor] remove sandstone_summit_booth.npc.secret_glitch.interactor
tag @s add sandstone_summit_booth.npc.secret_glitch.interactor
advancement revoke @s only sandstone_summit_booth:npcs/interact/secret_glitch
execute as @e[tag=sandstone_summit_booth.npc.secret_glitch, type=minecraft:mannequin] run function sandstone_summit_booth:sections/npcs/tick/execute_as10/execute_as/if