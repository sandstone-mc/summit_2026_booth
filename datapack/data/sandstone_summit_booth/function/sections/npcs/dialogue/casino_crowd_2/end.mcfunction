scoreboard players reset @s sandstone_summit_booth.npc.dialogue.line
tag @s remove sandstone_summit_booth.npc.dialogue.revealing
execute at @s run function sandstone_summit_booth:sections/npcs/dialogue/casino_crowd_2/end/execute_at
tag @a[tag=sandstone_summit_booth.npc.blue_tent_guide.interactor] remove sandstone_summit_booth.npc.blue_tent_guide.interactor
tag @a[tag=sandstone_summit_booth.npc.red_tent_sandstone.interactor] remove sandstone_summit_booth.npc.red_tent_sandstone.interactor
tag @a[tag=sandstone_summit_booth.npc.credits.interactor] remove sandstone_summit_booth.npc.credits.interactor
tag @a[tag=sandstone_summit_booth.npc.glitchy.interactor] remove sandstone_summit_booth.npc.glitchy.interactor
tag @a[tag=sandstone_summit_booth.npc.casino_crowd_1.interactor] remove sandstone_summit_booth.npc.casino_crowd_1.interactor
tag @a[tag=sandstone_summit_booth.npc.casino_crowd_2.interactor] remove sandstone_summit_booth.npc.casino_crowd_2.interactor
tag @a[tag=sandstone_summit_booth.npc.casino_crowd_3.interactor] remove sandstone_summit_booth.npc.casino_crowd_3.interactor