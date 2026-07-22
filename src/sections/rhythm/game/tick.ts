import { MCFunction } from 'sandstone'
import { ticking } from '@shared'
import { collisionTick } from './walls/collision'
import { wallTick } from './walls/ticking'
import { scoringTick } from './scoring'
import { parkourTick } from './parkour'
import { timerTick } from './end'

MCFunction(
	'sections/rhythm/tick',
	() => {
		collisionTick()
		wallTick()
		scoringTick()
		parkourTick()
		timerTick()
	},
	{ tags: [ticking] },
)
