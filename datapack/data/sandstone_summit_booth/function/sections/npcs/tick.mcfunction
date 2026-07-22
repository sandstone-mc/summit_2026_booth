scoreboard players add #global sandstone_summit_booth.npc.tick_counter 1
execute as @e[tag=sandstone_summit_booth.npc.credits, type=minecraft:mannequin] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as
execute as @e[tag=sandstone_summit_booth.npc.blue_tent_guide, type=minecraft:mannequin] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as2
execute as @e[tag=sandstone_summit_booth.npc.red_tent_sandstone, type=minecraft:mannequin] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as3
execute as @e[tag=sandstone_summit_booth.npc.glitchy, type=minecraft:mannequin] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as4
execute as @e[tag=sandstone_summit_booth.npc.casino_crowd_1, type=minecraft:mannequin] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as5
execute as @e[tag=sandstone_summit_booth.npc.casino_crowd_2, type=minecraft:mannequin] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as6
execute as @e[tag=sandstone_summit_booth.npc.casino_crowd_3, type=minecraft:mannequin] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as7