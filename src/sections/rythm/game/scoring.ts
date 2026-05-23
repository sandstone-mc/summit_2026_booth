import { _, execute, MCFunction, Objective, playsound, Selector, title, scoreboard } from 'sandstone'
import { GameState, Tags, allPlayers, alivePlayers, gameState } from './state'
import { beatFlagScore } from './walls/ticking'
import { wallLives } from './walls/collision'
import { DIM } from '../../../shared'

const COMBO_BONUS = 5

export const points = Objective.create('ssb_pts', 'dummy')
export const combo = Objective.create('ssb_cmb', 'dummy')
export const finalScore = Objective.create('ssb_scr', 'dummy')

const comboMod = Objective.create('ssb_cmod', 'dummy')
const comboModScore = comboMod('$mod')
const comboDiv = Objective.create('ssb_cdiv', 'dummy')
const comboDivScore = comboDiv('$div')

MCFunction('sections/rythm/scoring/init', () => {
	comboDivScore.set(10)
}, { runOnLoad: true })

MCFunction('sections/rythm/scoring/tick', () => {
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

				comboModScore.set(combo('@s'))
				comboModScore.modulo(comboDivScore)
				_.if(_.and(comboModScore.equalTo(0), combo('@s').greaterThan(0)), () => {
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

const maxComboObj = Objective.create('ssb_mc', 'dummy')
const maxComboScore = maxComboObj('$max')
const tempCombo = Objective.create('ssb_tc', 'dummy')
const MAX_COMBO = 50
const maxScoreObj = Objective.create('ssb_ms', 'dummy')
const maxScoreScore = maxScoreObj('$max')

export const computeScores = MCFunction('sections/rythm/scoring/compute', () => {
	maxComboScore.set(MAX_COMBO)

	execute.as(allPlayers).run(() => {
		tempCombo('@s').set(combo('@s'))
		scoreboard.players.operation(tempCombo('@s'), '<', maxComboScore)
		tempCombo('@s').add(MAX_COMBO)

		finalScore('@s').set(points('@s'))
		finalScore('@s').multiply(tempCombo('@s'))
		finalScore('@s').divide(maxComboScore)
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
