tag @a[tag=sandstone_summit_booth.npc.casino_crowd_2.interactor] remove sandstone_summit_booth.npc.casino_crowd_2.interactor
tag @s add sandstone_summit_booth.npc.casino_crowd_2.interactor
execute as @e[type=minecraft:mannequin, tag=sandstone_summit_booth.npc.casino_crowd_2] run function sandstone_summit_booth:sections/npcs/interact_reward/casino_crowd_2/execute_as