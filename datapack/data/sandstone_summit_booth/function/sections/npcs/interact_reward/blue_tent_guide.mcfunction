tag @a[tag=sandstone_summit_booth.npc.blue_tent_guide.interactor] remove sandstone_summit_booth.npc.blue_tent_guide.interactor
tag @s add sandstone_summit_booth.npc.blue_tent_guide.interactor
execute as @e[type=minecraft:mannequin, tag=sandstone_summit_booth.npc.blue_tent_guide] run function sandstone_summit_booth:sections/npcs/interact_reward/blue_tent_guide/execute_as