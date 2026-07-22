schedule clear sandstone_summit_booth:sections/presentation/slides/loop
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/schedule
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep2
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep3
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep4
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep5
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep6
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep7
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep8
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep9
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep10
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep11
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep12
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep13
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep14
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep15
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep16
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep17
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep18
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep19
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep20
schedule clear sandstone_summit_booth:sections/presentation/slides/loop/__sleep21
execute if score #current sandstone_summit_booth.presentation.slide_idx matches 20 run return 0
scoreboard players add #current sandstone_summit_booth.presentation.slide_idx 1
execute store result score #shown_at sandstone_summit_booth.presentation.scroll run time query gametime
function sandstone_summit_booth:sections/presentation/slides/hide/0
function sandstone_summit_booth:sections/presentation/slides/hide/1
function sandstone_summit_booth:sections/presentation/slides/hide/2
function sandstone_summit_booth:sections/presentation/slides/hide/3
function sandstone_summit_booth:sections/presentation/slides/hide/4
function sandstone_summit_booth:sections/presentation/slides/hide/5
function sandstone_summit_booth:sections/presentation/slides/hide/6
function sandstone_summit_booth:sections/presentation/slides/hide/7
function sandstone_summit_booth:sections/presentation/slides/hide/8
function sandstone_summit_booth:sections/presentation/slides/hide/9
function sandstone_summit_booth:sections/presentation/slides/hide/10
function sandstone_summit_booth:sections/presentation/slides/hide/11
function sandstone_summit_booth:sections/presentation/slides/hide/12
function sandstone_summit_booth:sections/presentation/slides/hide/13
function sandstone_summit_booth:sections/presentation/slides/hide/14
function sandstone_summit_booth:sections/presentation/slides/hide/15
function sandstone_summit_booth:sections/presentation/slides/hide/16
function sandstone_summit_booth:sections/presentation/slides/hide/17
function sandstone_summit_booth:sections/presentation/slides/hide/18
function sandstone_summit_booth:sections/presentation/slides/hide/19
function sandstone_summit_booth:sections/presentation/slides/hide/20
execute store result storage __sandstone:variable anon_WnYlBycD_7.env_0 int 1 run scoreboard players get #current sandstone_summit_booth.presentation.slide_idx
return run function sandstone_summit_booth:sections/presentation/slides/next/switch/dispatch with storage __sandstone:variable anon_WnYlBycD_7