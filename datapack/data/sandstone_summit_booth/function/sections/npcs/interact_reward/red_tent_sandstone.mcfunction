tag @a[tag=sandstone_summit_booth.npc.red_tent_sandstone.interactor] remove sandstone_summit_booth.npc.red_tent_sandstone.interactor
tag @s add sandstone_summit_booth.npc.red_tent_sandstone.interactor
advancement revoke @s only sandstone_summit_booth:npcs/interact/red_tent_sandstone
execute as @e[tag=sandstone_summit_booth.npc.red_tent_sandstone, type=minecraft:mannequin] run function sandstone_summit_booth:sections/npcs/interact_reward/red_tent_sandstone/execute_as