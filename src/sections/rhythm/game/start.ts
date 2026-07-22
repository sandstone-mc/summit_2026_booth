import {
	_,
	execute,
	MCFunction,
	playsound,
	Selector,
	tag,
	tellraw,
	title,
	type MCFunctionClass,
	Variable,
} from 'sandstone'
import { calOffsetMs, calibrationDepth } from '@rhythm/index'
import { GameStatus, Tags, status, gamePlayer } from './state'
import { setActive } from './active'

import { gameplay } from '@rhythm/config'
import { startShowcaseSession } from 'src/sections/main/showcase'

const countdown = Variable(0)
const startedGametime = Variable(0)
const cancelDelta = Variable(0)

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
			startShowcaseSession()
			status.set(GameStatus.STARTING)
			execute.store.result.score(startedGametime).run.time.query('gametime')
			calibrationDepth.set(0)
			execute.store.result
				.score(calibrationDepth)
				.run.scoreboard.players.get(Selector('@a', { tag: Tags.PLAYER, limit: 1 }), calOffsetMs.name)
			calibrationDepth.multiply(10)
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
			execute.store.result.score(cancelDelta).run.time.query('gametime')
			cancelDelta.remove(startedGametime)
			_.if(cancelDelta.greaterThanOrEqualTo(10), () => {
				countdownTick.schedule.clear()
				title(gamePlayer).actionbar({ text: 'Cancelled.', color: 'red' })
				tag(gamePlayer).remove(Tags.PLAYER)
				status.set(GameStatus.WAITING)
			})
		})
	},
	{ lazy: true },
)
