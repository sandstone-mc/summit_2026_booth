import { _, execute, MCFunction, playsound, Selector, tag, title, type MCFunctionClass, Variable } from 'sandstone'
import { GameStatus, Tags, status, gamePlayer } from './state'
import { setActive } from './active'

import { gameplay } from '@rhythm/config'

const countdown = Variable(0)

const countdownTick = MCFunction('sections/rhythm/start/countdown_tick', (self: MCFunctionClass) => {
	_.if(status.equalTo(GameStatus.STARTING), () => {
		_.if(countdown.greaterThan(0), () => {
			execute.as(gamePlayer).at('@s').run.playsound('minecraft:block.note_block.hat', 'master', '@s')

			_.if(countdown.greaterThanOrEqualTo(4), () => {
				title(gamePlayer).actionbar([{ text: 'Starting in ', color: 'green' }, countdown, ' seconds...'])
			})
				.elseIf(countdown.greaterThanOrEqualTo(2), () => {
					title(gamePlayer).actionbar([{ text: 'Starting in ', color: 'yellow' }, countdown, ' seconds...'])
				})
				.else(() => {
					title(gamePlayer).actionbar([{ text: 'Starting in ', color: 'red' }, countdown, ' second...'])
				})

			countdown.remove(1)
			self.schedule.function('1s', 'replace')
		}).else(() => {
			setActive()
		})
	})
})

export const startGame = MCFunction(
	'sections/rhythm/start/init',
	() => {
		_.if(status.equalTo(GameStatus.WAITING), () => {
			status.set(GameStatus.STARTING)
			countdown.set(gameplay.countdown)
			countdownTick()
		})
	},
	{ lazy: true },
)

export const cancelStart = MCFunction(
	'sections/rhythm/start/cancel',
	() => {
		_.if(status.equalTo(GameStatus.STARTING), () => {
			countdownTick.schedule.clear()
			title(gamePlayer).actionbar({ text: 'Cancelled.', color: 'red' })
			tag(gamePlayer).remove(Tags.PLAYER)
			status.set(GameStatus.WAITING)
		})
	},
	{ lazy: true },
)
