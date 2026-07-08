import { MCFunction } from 'sandstone'
import { ticking } from '@shared'
import { collisionTick } from './walls/collision'
import { wallTick } from './walls/ticking'
import { scoringTick } from './scoring'
import { parkourTick } from './parkour'
import { settingsTick } from './settings'
import { leaderboardTick } from './leaderboard'
import { timerTick } from './end'

MCFunction(
	'sections/rhythm/tick',
	() => {
		collisionTick()
		wallTick()
		scoringTick()
		parkourTick()
		settingsTick()
		leaderboardTick()
		timerTick()
	},
	{ tags: [ticking] },
)
