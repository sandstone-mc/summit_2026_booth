import { _, execute, MCFunction, Objective, playsound, Selector, title, scoreboard } from 'sandstone'
import { GameState, Tags, allPlayers, alivePlayers, gameState } from './state'
import { beatFlagScore } from './walls/ticking'
import { wallLives } from './walls/collision'
import { DIM } from '../../../shared'

const COMBO_BONUS = 5

export const points = Objective.create('rhythm.points', 'dummy')
export const combo = Objective.create('rhythm.combo', 'dummy')
export const finalScore = Objective.create('rhythm.score', 'dummy')

const comboMod = combo('$mod')
const comboDiv = combo('$div')

MCFunction('sections/rhythm/scoring/init', () => {
	comboDiv.set(10)
}, { runOnLoad: true })

MCFunction('sections/rhythm/scoring/tick', () => {
	_.if(gameState.equalTo(GameState.ACTIVE), () => {
		execute.as(alivePlayers).run(() => {
			title('@s').actionbar([
				{ text: 'Lives: ', color: 'red' },
				wallLives('@s'),
				{ text: '  |  ', color: 'dark_gray' },
				{ text: 'Score: ', color: 'aqua' },
				points('@s'),
				{ text: '  |  ', color: 'dark_gray' },
				{ text: 'Combo: ', color: 'yellow' },
				combo('@s'),
			])
		})

		_.if(beatFlagScore.greaterThan(0), () => {
			beatFlagScore.set(0)

			execute.in(DIM).as(Selector('@a', {
				tag: [Tags.ALIVE, Tags.PLAYER, `!${Tags.HIT_TICK}`],
			})).at('@s').run(() => {
				points('@s').add(1)
				combo('@s').add(1)

				comboMod.set(combo('@s'))
				comboMod.modulo(comboDiv)
				_.if(_.and(comboMod.equalTo(0), combo('@s').greaterThan(0)), () => {
					points('@s').add(COMBO_BONUS)
				})

				_.if(combo('@s').equalTo(50), () => {
					title('@s').title({ text: '' })
					title('@s').subtitle({ text: '50x COMBO!', color: 'light_purple', bold: true })
					playsound('minecraft:item.totem.use', 'master', '@s')
				}).elseIf(combo('@s').equalTo(25), () => {
					title('@s').title({ text: '' })
					title('@s').subtitle({ text: '25x COMBO!', color: 'aqua', bold: true })
					playsound('minecraft:block.enchantment_table.use', 'master', '@s')
				}).elseIf(combo('@s').equalTo(10), () => {
					title('@s').title({ text: '' })
					title('@s').subtitle({ text: '10x COMBO!', color: 'yellow', bold: true })
					playsound('minecraft:entity.player.levelup', 'master', '@s')
				})
			})
		})
	})
}, { runEveryTick: true })

const tempCombo = Objective.create('rhythm.combo_temp', 'dummy')
const MAX_COMBO = 50

export const computeScores = MCFunction('sections/rhythm/scoring/compute', () => {
	execute.as(allPlayers).run(() => {
		tempCombo('@s').set(combo('@s'))
		tempCombo('@s')['<'](MAX_COMBO)
		tempCombo('@s').add(MAX_COMBO)

		finalScore('@s').set(points('@s'))
		finalScore('@s').multiply(tempCombo('@s'))
		finalScore('@s').divide(MAX_COMBO)
	})

	title(allPlayers).times(10, 60, 20)
	title(allPlayers).title({ text: 'Game Over!', color: 'red', bold: true })
	execute.as(allPlayers).run(() => {
		title('@s').subtitle([
			{ text: 'Score: ', color: 'gray' },
			finalScore('@s'),
		])
	})
}, { lazy: true })
