tag @a[tag=sandstone_summit_booth.npc.casino_crowd_2.interactor] remove sandstone_summit_booth.npc.casino_crowd_2.interactor
tag @s add sandstone_summit_booth.npc.casino_crowd_2.interactor
advancement revoke @s only sandstone_summit_booth:npcs/interact/casino_crowd_2
execute as @e[tag=sandstone_summit_booth.npc.casino_crowd_2, type=minecraft:mannequin] run function sandstone_summit_booth:sections/npcs/interact_reward/casino_crowd_2/execute_as