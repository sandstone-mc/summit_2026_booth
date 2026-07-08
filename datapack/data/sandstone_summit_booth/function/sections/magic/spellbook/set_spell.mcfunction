$data modify storage sandstone_summit_booth:temps macro.spellID set value $(param_0)
data modify storage sandstone_summit_booth:temps macro.schoolID set from storage sandstone_summit_booth:io data.current_school_uid
function sandstone_summit_booth:sections/magic/spellbook/set_spell/macro with storage sandstone_summit_booth:temps macro