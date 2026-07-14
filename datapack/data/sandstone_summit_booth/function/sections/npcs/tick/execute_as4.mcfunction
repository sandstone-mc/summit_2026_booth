execute if score @s sandstone_summit_booth.npc.interact_cooldown matches 1.. run scoreboard players remove @s sandstone_summit_booth.npc.interact_cooldown 1
scoreboard players operation anon_WnYlBycD_82 __sandstone = #global sandstone_summit_booth.npc.tick_counter
scoreboard players operation anon_WnYlBycD_82 __sandstone %= 5 __sandstone
execute if score @s sandstone_summit_booth.npc.dialogue.line matches 0.. if score anon_WnYlBycD_82 __sandstone matches 0 run function sandstone_summit_booth:sections/npcs/tick/execute_as4/if2
execute if score @s sandstone_summit_booth.npc.dialogue.line matches 0.. if entity @s[tag=sandstone_summit_booth.npc.dialogue.revealing] run function sandstone_summit_booth:sections/npcs/tick/execute_as4/if3
execute if entity @a[tag=sandstone_summit_booth.npc.glitchy.interactor, limit=1] run rotate @s facing entity @a[tag=sandstone_summit_booth.npc.glitchy.interactor,limit=1] feet
execute unless entity @a[tag=sandstone_summit_booth.npc.glitchy.interactor, limit=1] run rotate @s 0 0