tag @a[tag=sandstone_summit_booth.npc.credits.interactor] remove sandstone_summit_booth.npc.credits.interactor
tag @s add sandstone_summit_booth.npc.credits.interactor
execute as @e[type=minecraft:mannequin, tag=sandstone_summit_booth.npc.credits] run function sandstone_summit_booth:sections/npcs/interact_reward/credits/execute_as