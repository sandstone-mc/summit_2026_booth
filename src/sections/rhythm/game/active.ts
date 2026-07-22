import { _, abs, attribute, effect, execute, MCFunction, playsound, tp, Variable } from 'sandstone'
import { arena } from '@rhythm/config/internal/arena'
import { songCount, songDurations } from '@rhythm/config/internal/songs'
import { GameStatus, Tags, gamePlayer, status, songSelect } from './state'
import { hitsTaken, wallLives } from './walls/collision'
import { points, combo, finalScore } from './scoring'
import { livesSetting, updateSettingsPanel } from './settings'
import { playSong, scheduleWalls } from './songs'
import { spawnLaneShulkers, spawnLaneBorder } from './lane-effects'

export const timer = Variable(0)

export const setActive = MCFunction(
	'sections/rhythm/active/init',
	() => {
		status.set(GameStatus.ACTIVE)

		execute.as(gamePlayer).run(() => {
			const [x, y, z] = arena.playerSpawn
			tp('@s', abs(x, y, z), [`${arena.playerYaw}`, '0'])

			execute.at('@s').run.playsound('minecraft:entity.player.levelup', 'master', '@s')

			wallLives('@s').set(livesSetting)
			hitsTaken('@s').set(0)
			effect.give('@s', 'minecraft:instant_health', 1, 126, true)
			effect.give('@s', 'minecraft:saturation', 99999, 0, true)
			points('@s').set(0)
			combo('@s').set(0)
			finalScore('@s').set(0)
		})

		if (songCount === 0) {
			timer.set(0)
		} else if (songCount === 1) {
			timer.set(songDurations[0] * 20)
		} else {
			_.switch(
				songSelect,
				songDurations.map((duration, songI) => ['case', songI, () => timer.set(duration * 20)] as const),
			)
		}

		spawnLaneShulkers()
		spawnLaneBorder()
		playSong()
		scheduleWalls()
		updateSettingsPanel()
	},
	{ lazy: true },
)
