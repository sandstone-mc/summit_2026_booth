import { _, execute, MCFunction, Objective, playsound, Selector, title, scoreboard } from 'sandstone'
import { GameStatus, Tags, allPlayers, alivePlayers, status } from './state'
import { beatFlag } from './walls/ticking'
import { wallLives } from './walls/collision'
import { beatLaneEffect } from './lane-effects'
import { DIMENSION } from '@shared'
import { gameplay } from '@rhythm/config'

export const points = Objective.create('rhythm.points', 'dummy')
export const combo = Objective.create('rhythm.combo', 'dummy')
export const finalScore = Objective.create('rhythm.score', 'dummy')

const comboMod = combo('$mod')
const comboDiv = combo('$div')

MCFunction('sections/rhythm/scoring/init', () => {
	comboDiv.set(gameplay.scoring.comboDivisor)
}, { runOnLoad: true })

MCFunction('sections/rhythm/scoring/tick', () => {
	_.if(status.equalTo(GameStatus.ACTIVE), () => {
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

		_.if(beatFlag.greaterThan(0), () => {
			beatFlag.set(0)
			beatLaneEffect()

			execute.in(DIMENSION).as(Selector('@a', {
				tag: [Tags.ALIVE, Tags.PLAYER, `!${Tags.HIT_TICK}`],
			})).at('@s').run(() => {
				points('@s').add(1)
				combo('@s').add(1)

				comboMod.set(combo('@s'))
				comboMod.modulo(comboDiv)
				_.if(_.and(comboMod.equalTo(0), combo('@s').greaterThan(0)), () => {
					points('@s').add(gameplay.scoring.comboBonus)
				})

				_.if(combo('@s').equalTo(gameplay.scoring.milestones[2]), () => {
					title('@s').title({ text: '' })
					title('@s').subtitle({ text: `${gameplay.scoring.milestones[2]}x COMBO!`, color: 'light_purple', bold: true })
					playsound('minecraft:item.totem.use', 'master', '@s')
				}).elseIf(combo('@s').equalTo(gameplay.scoring.milestones[1]), () => {
					title('@s').title({ text: '' })
					title('@s').subtitle({ text: `${gameplay.scoring.milestones[1]}x COMBO!`, color: 'aqua', bold: true })
					playsound('minecraft:block.enchantment_table.use', 'master', '@s')
				}).elseIf(combo('@s').equalTo(gameplay.scoring.milestones[0]), () => {
					title('@s').title({ text: '' })
					title('@s').subtitle({ text: `${gameplay.scoring.milestones[0]}x COMBO!`, color: 'yellow', bold: true })
					playsound('minecraft:entity.player.levelup', 'master', '@s')
				})
			})
		})
	})
}, { runEveryTick: true })

const tempCombo = Objective.create('rhythm.combo_temp', 'dummy')

export const computeScores = MCFunction('sections/rhythm/scoring/compute', () => {
	execute.as(allPlayers).run(() => {
		tempCombo('@s').set(combo('@s'))
		// Clamp combo to max (Sandstone's < operator via bracket notation)
		tempCombo('@s')['<'](gameplay.scoring.maxCombo)
		tempCombo('@s').add(gameplay.scoring.maxCombo)

		finalScore('@s').set(points('@s'))
		finalScore('@s').multiply(tempCombo('@s'))
		finalScore('@s').divide(gameplay.scoring.maxCombo)
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
