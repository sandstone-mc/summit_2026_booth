tag @a[tag=sandstone_summit_booth.npc.red_tent_sandstone.interactor] remove sandstone_summit_booth.npc.red_tent_sandstone.interactor
tag @s add sandstone_summit_booth.npc.red_tent_sandstone.interactor
execute as @e[type=minecraft:mannequin, tag=sandstone_summit_booth.npc.red_tent_sandstone] run function sandstone_summit_booth:sections/npcs/interact_reward/red_tent_sandstone/execute_as