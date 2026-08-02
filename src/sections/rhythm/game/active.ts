import { _, abs, advancement, attribute, effect, execute, MCFunction, playsound, tp, Variable } from 'sandstone'
import { arena } from '@rhythm/config/internal/arena'
import { songCount, songDurations } from '@rhythm/config/internal/songs'
import { GameStatus, Tags, gamePlayer, status, songSelect } from './state'
import { hitsTaken, wallLives } from './walls/collision'
import { points, combo, finalScore } from './scoring'
import { livesSetting, updateSettingsPanel } from './settings'
import { playSong, scheduleWalls } from './songs'
import { spawnLaneHighlight, spawnLaneBorder } from './lane-effects'

export const timer = Variable(0)

export const grantSticker = MCFunction(
	'sections/rhythm/active/grant_sticker',
	() => {
		advancement.grant(gamePlayer).only('summit.sticker_book:sandstone_summit_booth/rhythm')
	},
	{ lazy: true },
)

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

		spawnLaneHighlight()
		spawnLaneBorder()
		playSong()
		scheduleWalls()
		updateSettingsPanel()

		grantSticker.schedule.function('30s', 'replace')
	},
	{ lazy: true },
)
