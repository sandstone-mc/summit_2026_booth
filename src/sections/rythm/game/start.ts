import { _, execute, MCFunction, Objective, playsound, schedule, title, tp } from 'sandstone'
import { GameState, gameState, allPlayers } from './state'
import { setActive } from './active'
import { NAMESPACE } from '../../../shared'

const countdownScore = Objective.create('ssb_cd', 'dummy')
const cdScore = countdownScore('$cd')

const countdownTick = MCFunction('sections/rhythm/start/countdown_tick', () => {
	_.if(gameState.equalTo(GameState.STARTING), () => {
		_.if(cdScore.greaterThan(0), () => {
			execute.as(allPlayers).at('@s').run.playsound('minecraft:block.note_block.hat', 'master', '@s')

			_.if(cdScore.greaterOrEqualThan(4), () => {
				title(allPlayers).actionbar([{ text: 'Starting in ', color: 'green' }, cdScore, ' seconds...'])
			}).elseIf(cdScore.greaterOrEqualThan(2), () => {
				title(allPlayers).actionbar([{ text: 'Starting in ', color: 'yellow' }, cdScore, ' seconds...'])
			}).else(() => {
				title(allPlayers).actionbar([{ text: 'Starting in ', color: 'red' }, cdScore, ' second...'])
			})

			cdScore.remove(1)
			schedule.function(`${NAMESPACE}:sections/rhythm/start/countdown_tick`, '1s')
		}).else(() => {
			setActive()
		})
	})
})

export const startGame = MCFunction('sections/rhythm/start/init', () => {
	_.if(gameState.equalTo(GameState.WAITING), () => {
		gameState.set(GameState.STARTING)
		cdScore.set(5)
		schedule.function(`${NAMESPACE}:sections/rhythm/start/countdown_tick`, '1s')
	})
}, { lazy: true })

export const cancelStart = MCFunction('sections/rhythm/start/cancel', () => {
	_.if(gameState.equalTo(GameState.STARTING), () => {
		schedule.clear(`${NAMESPACE}:sections/rhythm/start/countdown_tick`)
		gameState.set(GameState.WAITING)
		title(allPlayers).actionbar({ text: 'Cancelled.', color: 'red' })
	})
}, { lazy: true })
