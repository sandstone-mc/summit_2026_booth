execute as @a[advancements={sandstone_summit_booth:npcs/interact/blue_tent_guide=true}] run function sandstone_summit_booth:sections/npcs/tick/execute_as
execute as @e[tag=sandstone_summit_booth.npc.blue_tent_guide, type=minecraft:mannequin] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as2
execute as @e[tag=sandstone_summit_booth.npc.blue_tent_guide, type=minecraft:mannequin] at @s run rotate @s facing entity @p feet
execute as @a[advancements={sandstone_summit_booth:npcs/interact/red_tent_sandstone=true}] run function sandstone_summit_booth:sections/npcs/tick/execute_as4
execute as @e[tag=sandstone_summit_booth.npc.red_tent_sandstone, type=minecraft:mannequin] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as5
execute as @e[tag=sandstone_summit_booth.npc.red_tent_sandstone, type=minecraft:mannequin] at @s run rotate @s facing entity @p feet
execute as @a[advancements={sandstone_summit_booth:npcs/interact/credits=true}] run function sandstone_summit_booth:sections/npcs/tick/execute_as7
execute as @e[tag=sandstone_summit_booth.npc.credits, type=minecraft:mannequin] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as8
execute as @e[tag=sandstone_summit_booth.npc.credits, type=minecraft:mannequin] at @s run rotate @s facing entity @p feet
execute as @a[advancements={sandstone_summit_booth:npcs/interact/glitchy=true}] run function sandstone_summit_booth:sections/npcs/tick/execute_as10
execute as @e[tag=sandstone_summit_booth.npc.glitchy, type=minecraft:mannequin] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as11
execute as @e[tag=sandstone_summit_booth.npc.glitchy, type=minecraft:mannequin] at @s run rotate @s facing entity @p feet
execute as @a[advancements={sandstone_summit_booth:npcs/interact/casino_crowd_1=true}] run function sandstone_summit_booth:sections/npcs/tick/execute_as13
execute as @e[tag=sandstone_summit_booth.npc.casino_crowd_1, type=minecraft:mannequin] at @s run function sandstone_summit_booth:sections/npcs/tick/execute_as14