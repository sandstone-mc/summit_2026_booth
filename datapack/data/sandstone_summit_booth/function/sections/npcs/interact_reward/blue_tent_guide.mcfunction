tag @a[tag=sandstone_summit_booth.npc.blue_tent_guide.interactor] remove sandstone_summit_booth.npc.blue_tent_guide.interactor
tag @s add sandstone_summit_booth.npc.blue_tent_guide.interactor
advancement revoke @s only sandstone_summit_booth:npcs/interact/blue_tent_guide
execute as @e[tag=sandstone_summit_booth.npc.blue_tent_guide, type=minecraft:mannequin] run function sandstone_summit_booth:sections/npcs/interact_reward/blue_tent_guide/execute_as