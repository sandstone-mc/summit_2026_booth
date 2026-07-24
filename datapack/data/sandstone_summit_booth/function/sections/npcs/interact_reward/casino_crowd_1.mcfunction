tag @a[tag=sandstone_summit_booth.npc.casino_crowd_1.interactor] remove sandstone_summit_booth.npc.casino_crowd_1.interactor
tag @s add sandstone_summit_booth.npc.casino_crowd_1.interactor
advancement revoke @s only sandstone_summit_booth:npcs/interact/casino_crowd_1
execute as @e[type=minecraft:mannequin, tag=sandstone_summit_booth.npc.casino_crowd_1, tag=sandstone_summit_booth.npc.casino_crowd_1] run function sandstone_summit_booth:sections/npcs/interact_reward/casino_crowd_1/execute_as