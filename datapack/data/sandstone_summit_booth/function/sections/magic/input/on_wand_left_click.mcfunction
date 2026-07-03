function sandstone_summit_booth:sections/magic/playerdb/get_self
data modify storage sandstone_summit_booth:macro school set from storage sandstone_summit_booth:io data.current_school
function sandstone_summit_booth:sections/magic/input/_open_school_dialog with storage sandstone_summit_booth:macro {}