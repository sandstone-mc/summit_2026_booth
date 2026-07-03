tag @s add sandstone_summit_booth.status.static_field
scoreboard players set @s sandstone_summit_booth.status.static_field_timer 200
tellraw @s {"text":"Static Field activated!","color":"yellow"}
particle electric_spark ~ ~1 ~ 0.5 1 0.5 0.1 40 force
execute store result score @s __sandstone.asyncTimer.sandstone_summit_booth.sections.magic.spells.lightning.static_field.do_cast run time query gametime
scoreboard players add @s __sandstone.asyncTimer.sandstone_summit_booth.sections.magic.spells.lightning.static_field.do_cast 200
tag @s add __sandstone.asyncTimer.sandstone_summit_booth.sections.magic.spells.lightning.static_field.do_cast
schedule function sandstone_summit_booth:sections/magic/spells/lightning/static_field/do_cast/__sleep/_context 10s replace