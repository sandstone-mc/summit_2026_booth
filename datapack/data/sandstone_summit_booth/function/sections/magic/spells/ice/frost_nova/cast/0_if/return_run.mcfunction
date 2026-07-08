scoreboard players remove @s sandstone_summit_booth.mana 25
advancement grant @s only summit.sticker_book:sandstone_summit_booth/arcane_arts
execute anchored eyes rotated as @s run summon marker ^ ^ ^3 {Tags:['sandstone_summit_booth.spell.ice.frost_nova.arc_center']}
execute as @e[distance=0..5.5, type=#sandstone_summit_booth:targetable] at @s run function sandstone_summit_booth:sections/magic/spells/ice/frost_nova/cast/0_if/return_run/execute_as
execute anchored eyes rotated as @s run function sandstone_summit_booth:sections/magic/spells/ice/frost_nova/cast/0_if/return_run/execute_anchored2
kill @e[tag=sandstone_summit_booth.spell.ice.frost_nova.arc_center]