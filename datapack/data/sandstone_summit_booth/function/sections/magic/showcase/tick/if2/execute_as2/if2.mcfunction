execute store result score #mob_type_pick sandstone_summit_booth.showcase.state run random value 0..1 sandstone_summit_booth:showcase_mob_type
execute store result score #armor_pick sandstone_summit_booth.showcase.state run random value 0..2 sandstone_summit_booth:showcase_armor
function sandstone_summit_booth:sections/magic/showcase/tick/if2/execute_as2/if2/if
scoreboard players add #mob_count sandstone_summit_booth.showcase.state 1