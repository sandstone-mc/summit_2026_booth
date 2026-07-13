schedule clear sandstone_summit_booth:presentation/slides/loop
schedule clear sandstone_summit_booth:presentation/slides/loop/schedule
schedule clear sandstone_summit_booth:presentation/slides/loop/__sleep
schedule clear sandstone_summit_booth:presentation/slides/loop/__sleep2
schedule clear sandstone_summit_booth:presentation/slides/loop/__sleep3
schedule clear sandstone_summit_booth:presentation/slides/loop/__sleep4
schedule clear sandstone_summit_booth:presentation/slides/loop/__sleep5
schedule clear sandstone_summit_booth:presentation/slides/loop/__sleep6
schedule clear sandstone_summit_booth:presentation/slides/loop/__sleep7
schedule clear sandstone_summit_booth:presentation/slides/loop/__sleep8
schedule clear sandstone_summit_booth:presentation/slides/loop/__sleep9
schedule clear sandstone_summit_booth:presentation/slides/loop/__sleep10
schedule clear sandstone_summit_booth:presentation/slides/loop/__sleep11
schedule clear sandstone_summit_booth:presentation/slides/loop/__sleep12
schedule clear sandstone_summit_booth:presentation/slides/loop/__sleep13
schedule clear sandstone_summit_booth:presentation/slides/loop/__sleep14
schedule clear sandstone_summit_booth:presentation/slides/loop/__sleep15
schedule clear sandstone_summit_booth:presentation/slides/loop/__sleep16
schedule clear sandstone_summit_booth:presentation/slides/loop/__sleep17
scoreboard players add #current sandstone_summit_booth.presentation.slide_idx 1
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 17.. run scoreboard players set #current sandstone_summit_booth.presentation.slide_idx 0
execute store result score #shown_at sandstone_summit_booth.presentation.scroll run time query gametime
function sandstone_summit_booth:presentation/slides/hide/0
function sandstone_summit_booth:presentation/slides/hide/1
function sandstone_summit_booth:presentation/slides/hide/2
function sandstone_summit_booth:presentation/slides/hide/3
function sandstone_summit_booth:presentation/slides/hide/4
function sandstone_summit_booth:presentation/slides/hide/5
function sandstone_summit_booth:presentation/slides/hide/6
function sandstone_summit_booth:presentation/slides/hide/7
function sandstone_summit_booth:presentation/slides/hide/8
function sandstone_summit_booth:presentation/slides/hide/9
function sandstone_summit_booth:presentation/slides/hide/10
function sandstone_summit_booth:presentation/slides/hide/11
function sandstone_summit_booth:presentation/slides/hide/12
function sandstone_summit_booth:presentation/slides/hide/13
function sandstone_summit_booth:presentation/slides/hide/14
function sandstone_summit_booth:presentation/slides/hide/15
function sandstone_summit_booth:presentation/slides/hide/16
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 0 run function sandstone_summit_booth:presentation/slides/show/0
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 1 run function sandstone_summit_booth:presentation/slides/show/1
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 2 run function sandstone_summit_booth:presentation/slides/show/2
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 3 run function sandstone_summit_booth:presentation/slides/show/3
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 4 run function sandstone_summit_booth:presentation/slides/show/4
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 5 run function sandstone_summit_booth:presentation/slides/show/5
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 6 run function sandstone_summit_booth:presentation/slides/show/6
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 7 run function sandstone_summit_booth:presentation/slides/show/7
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 8 run function sandstone_summit_booth:presentation/slides/show/8
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 9 run function sandstone_summit_booth:presentation/slides/show/9
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 10 run function sandstone_summit_booth:presentation/slides/show/10
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 11 run function sandstone_summit_booth:presentation/slides/show/11
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 12 run function sandstone_summit_booth:presentation/slides/show/12
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 13 run function sandstone_summit_booth:presentation/slides/show/13
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 14 run function sandstone_summit_booth:presentation/slides/show/14
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 15 run function sandstone_summit_booth:presentation/slides/show/15
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 16 run function sandstone_summit_booth:presentation/slides/show/16