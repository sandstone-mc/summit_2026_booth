scoreboard players add #global sandstone_summit_booth.npc.tick_counter 1
execute as @e[type=minecraft:mannequin, tag=sandstone_summit_booth.npc.blue_tent_guide] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as
execute as @e[type=minecraft:mannequin, tag=sandstone_summit_booth.npc.red_tent_sandstone] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as2
execute as @e[type=minecraft:mannequin, tag=sandstone_summit_booth.npc.credits] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as3
execute as @e[type=minecraft:mannequin, tag=sandstone_summit_booth.npc.glitchy] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as4
execute as @e[type=minecraft:mannequin, tag=sandstone_summit_booth.npc.casino_crowd_1] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as5
execute as @e[type=minecraft:mannequin, tag=sandstone_summit_booth.npc.casino_crowd_2] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as6
execute as @e[type=minecraft:mannequin, tag=sandstone_summit_booth.npc.casino_crowd_3] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as7