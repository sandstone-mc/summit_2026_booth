import { Data, Objective, _ } from 'sandstone'

export const setSchoolTrigger = Objective.create('set_school_trigger', 'trigger')

export const temps = Data('storage', 'sandstone_summit_booth:temps')