scoreboard players reset @s sandstone_summit_booth.npc.dialogue.line
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/red_tent_sandstone/end/execute_at
tag @a[tag=sandstone_summit_booth.npc.blue_tent_guide.interactor] remove sandstone_summit_booth.npc.blue_tent_guide.interactor
tag @a[tag=sandstone_summit_booth.npc.red_tent_sandstone.interactor] remove sandstone_summit_booth.npc.red_tent_sandstone.interactor
tag @a[tag=sandstone_summit_booth.npc.credits.interactor] remove sandstone_summit_booth.npc.credits.interactor
tag @a[tag=sandstone_summit_booth.npc.glitchy.interactor] remove sandstone_summit_booth.npc.glitchy.interactor
tag @a[tag=sandstone_summit_booth.npc.casino_crowd_1.interactor] remove sandstone_summit_booth.npc.casino_crowd_1.interactor