tag @a[tag=sandstone_summit_booth.npc.casino_crowd_3.interactor] remove sandstone_summit_booth.npc.casino_crowd_3.interactor
tag @s add sandstone_summit_booth.npc.casino_crowd_3.interactor
advancement revoke @s only sandstone_summit_booth:npcs/interact/casino_crowd_3
execute as @e[tag=sandstone_summit_booth.npc.casino_crowd_3, type=minecraft:mannequin] run function sandstone_summit_booth:sections/npcs/interact_reward/casino_crowd_3/execute_as