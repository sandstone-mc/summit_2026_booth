import { _, abs, effect, execute, gamemode, MCFunction, Objective, playsound, Predicate, rel, Selector, tag, title, tp } from 'sandstone'
import { arena } from '../../config/arena'
import { GameState, Tags, alivePlayers, gameState } from '../state'
import { Positions, DIM } from '../../../../shared'
import { endGame } from '../end'

const isSneaking = Predicate('is_sneaking', {
	condition: 'minecraft:entity_properties',
	entity: 'this',
	predicate: { flags: { is_sneaking: true } },
})

export const wallLives = Objective.create('ssb_wliv', 'dummy')
export const wallCd = Objective.create('ssb_wcd', 'dummy')

const HIT_COOLDOWN = 30

const onHit = MCFunction('sections/rhythm/collision/hit', () => {
	wallLives('@s').remove(1)

	tag('@s').add(Tags.HIT_TICK)
	tp('@s', rel(0, 5, 0))
	playsound('minecraft:entity.player.hurt', 'master', '@s')

	tag('@s').add(Tags.WALL_CD)
	wallCd('@s').set(HIT_COOLDOWN)

	_.if(wallLives('@s').lessOrEqualThan(0), () => {
		tag('@s').remove(Tags.ALIVE)
		tag('@s').remove(Tags.PLAYER)
		effect.clear('@s')
		title('@s').actionbar({ text: 'You died! Better luck next time.', color: 'red' })
		playsound('minecraft:entity.player.hurt', 'master', '@s', '~ ~ ~', 1.0, 0.5)
		execute.in('minecraft:overworld').run(() => {
			const [x, y, z] = Positions.BOOTH_RETURN
			tp('@s', abs(x, y, z))
		})
		gamemode('adventure', '@s')
	})
}, { lazy: true })

MCFunction('sections/rhythm/collision/tick', () => {
	_.if(gameState.equalTo(GameState.ACTIVE), () => {
		execute.in(DIM).run(() => {
			execute.as(Selector('@a', { tag: Tags.WALL_CD })).run(() => {
				wallCd('@s').remove(1)
				_.if(wallCd('@s').lessOrEqualThan(0), () => {
					tag('@s').remove(Tags.WALL_CD)
				})
			})

			execute.as(alivePlayers).at('@s').run(() => {
				_.if(_.and(
					_.not(_.entity(Selector('@s', { tag: Tags.WALL_CD }))),
					_.entity(Selector('@e', { tag: [Tags.WALL_HIT, `!${Tags.PARKOUR}`], distance: [0, 0.7] })),
				), () => {
					onHit()
				})
			})

			execute.as(Selector('@a', {
				tag: [Tags.ALIVE, Tags.PLAYER, `!${Tags.WALL_CD}`, `!${Tags.HIT_TICK}`],
			})).at('@s').unless.predicate(isSneaking)
				.positioned(rel(0, 1, 0))
				.if.entity(Selector('@e', { tag: [Tags.WALL_HIT, `!${Tags.PARKOUR}`], distance: [0, 0.7] }))
				.run(() => {
					onHit()
				})

			tag(Selector('@a', { tag: Tags.HIT_TICK })).remove(Tags.HIT_TICK)

			execute.unless.entity(alivePlayers).run(() => {
				endGame()
			})
		})
	})
}, { runEveryTick: true })
