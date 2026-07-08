$data modify storage sandstone_summit_booth:io data.current_school set from storage sandstone_summit_booth:ids schools.$(param_0).name
$data modify storage sandstone_summit_booth:io data.current_school_uid set value $(param_0)
$data modify storage sandstone_summit_booth:io data.selected_spell set from storage sandstone_summit_booth:ids schools.$(param_0).spells.0