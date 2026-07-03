import { _, execute, MCFunction, schedule, title } from 'sandstone'
import { GameStatus, status, allPlayers } from './state'
import { setActive } from './active'
import { NAMESPACE, state } from '@shared'
import { gameplay } from '@rhythm/config'

const countdown = state('$countdown')

const countdownTick = MCFunction('sections/rhythm/start/countdown_tick', () => {
	_.if(status.equalTo(GameStatus.STARTING), () => {
		_.if(countdown.greaterThan(0), () => {
			execute.as(allPlayers).at('@s').run.playsound('minecraft:block.note_block.hat', 'master', '@s')

			_.if(countdown.greaterThanOrEqualTo(4), () => {
				title(allPlayers).actionbar([{ text: 'Starting in ', color: 'green' }, countdown, ' seconds...'])
			}).elseIf(countdown.greaterThanOrEqualTo(2), () => {
				title(allPlayers).actionbar([{ text: 'Starting in ', color: 'yellow' }, countdown, ' seconds...'])
			}).else(() => {
				title(allPlayers).actionbar([{ text: 'Starting in ', color: 'red' }, countdown, ' second...'])
			})

			countdown.remove(1)
			schedule.function(`${NAMESPACE}:sections/rhythm/start/countdown_tick`, '1s')
		}).else(() => {
			setActive()
		})
	})
})

export const startGame = MCFunction('sections/rhythm/start/init', () => {
	_.if(status.equalTo(GameStatus.WAITING), () => {
		status.set(GameStatus.STARTING)
		countdown.set(gameplay.countdown)
		schedule.function(`${NAMESPACE}:sections/rhythm/start/countdown_tick`, '1s')
	})
}, { lazy: true })

export const cancelStart = MCFunction('sections/rhythm/start/cancel', () => {
	_.if(status.equalTo(GameStatus.STARTING), () => {
		schedule.clear(`${NAMESPACE}:sections/rhythm/start/countdown_tick`)
		status.set(GameStatus.WAITING)
		title(allPlayers).actionbar({ text: 'Cancelled.', color: 'red' })
	})
}, { lazy: true })
