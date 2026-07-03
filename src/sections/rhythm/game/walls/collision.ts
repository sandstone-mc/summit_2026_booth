import { _, abs, effect, execute, gamemode, kill, MCFunction, Objective, particle, playsound, Predicate, rel, Selector, tag, title, tp } from 'sandstone'
import { walls } from '@rhythm/config'
import { GameStatus, Tags, alivePlayers, status } from '@rhythm/game/state'
import { DIMENSION } from '@shared'
import { boothReturn } from '@rhythm/config/internal/derived'
import { endGame } from '@rhythm/game/end'

const isSneaking = Predicate('is_sneaking', {
	condition: 'minecraft:entity_properties',
	entity: 'this',
	predicate: { flags: { is_sneaking: true } },
})

export const wallLives = Objective.create('rhythm.wall.lives', 'dummy')
export const wallHitCooldown = Objective.create('rhythm.wall.hit_cooldown', 'dummy')

const flashPhase = Objective.create('ssb.flash_phase')

const breakNearbyWall = MCFunction('sections/rhythm/collision/break_wall', () => {
	execute.at('@s').run(() => {
		kill(Selector('@e', { tag: Tags.WALL, distance: [0, walls.breakRadius] }))
		playsound('minecraft:block.glass.break', 'master', '@a', '~ ~ ~', 2.0, 1.0)
		particle('minecraft:block{block_state:"minecraft:white_stained_glass"}', rel(0, 0.5, 0), [0.5, 0.5, 0.5], 0.1, 20)
	})
}, { lazy: true })

const onHit = MCFunction('sections/rhythm/collision/hit', () => {
	wallLives('@s').remove(1)

	tag('@s').add(Tags.HIT_TICK)
	breakNearbyWall()
	playsound('minecraft:entity.player.hurt', 'master', '@s')

	tag('@s').add(Tags.WALL_HIT_COOLDOWN)
	wallHitCooldown('@s').set(walls.cooldownTicks)
	effect.give('@s', 'minecraft:invisibility', 1, 0, true)

	_.if(wallLives('@s').lessOrEqualThan(0), () => {
		tag('@s').remove(Tags.ALIVE)
		tag('@s').remove(Tags.PLAYER)
		effect.clear('@s')
		title('@s').actionbar({ text: 'You died! Better luck next time.', color: 'red' })
		playsound('minecraft:entity.player.hurt', 'master', '@s', '~ ~ ~', 1.0, 0.5)
		execute.in('minecraft:overworld').run(() => {
			const [x, y, z] = boothReturn
			tp('@s', abs(x, y, z))
		})
		gamemode('adventure', '@s')
	})
}, { lazy: true })

MCFunction('sections/rhythm/collision/tick', () => {
	_.if(status.equalTo(GameStatus.ACTIVE), () => {
		execute.in(DIMENSION).run(() => {
			execute.as(Selector('@a', { tag: Tags.WALL_HIT_COOLDOWN })).run(() => {
				wallHitCooldown('@s').remove(1)
				_.if(wallHitCooldown('@s').lessOrEqualThan(0), () => {
					tag('@s').remove(Tags.WALL_HIT_COOLDOWN)
					effect.clear('@s', 'minecraft:invisibility')
				}).else(() => {
					flashPhase('@s').set(wallHitCooldown('@s'))
					flashPhase('@s').modulo(walls.flashInterval * 2)
					_.if(flashPhase('@s').lessThan(walls.flashInterval), () => {
						effect.give('@s', 'minecraft:invisibility', 1, 0, true)
					}).else(() => {
						effect.clear('@s', 'minecraft:invisibility')
					})
				})
			})

			execute.as(alivePlayers).at('@s').run(() => {
				_.if(_.and(
					_.not(_.entity(Selector('@s', { tag: Tags.WALL_HIT_COOLDOWN }))),
					_.entity(Selector('@e', { tag: [Tags.WALL_HIT, `!${Tags.PARKOUR}`], distance: [0, walls.hitRadius] })),
				), () => {
					onHit()
				})
			})

			execute.as(Selector('@a', {
				tag: [Tags.ALIVE, Tags.PLAYER, `!${Tags.WALL_HIT_COOLDOWN}`, `!${Tags.HIT_TICK}`],
			})).at('@s').unless.predicate(isSneaking)
				.positioned(rel(0, 1, 0))
				.if.entity(Selector('@e', { tag: [Tags.WALL_HIT, `!${Tags.PARKOUR}`], distance: [0, walls.hitRadius] }))
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
