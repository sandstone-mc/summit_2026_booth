import {
	_,
	abs,
	effect,
	execute,
	MCFunction,
	Objective,
	particle,
	playsound,
	Predicate,
	rel,
	Selector,
	tag,
	title,
	tp,
	Variable,
} from 'sandstone'
import { walls } from '@rhythm/config'
import { wallAge } from './spawning'
import { wallMovement } from '@rhythm/config/internal/derived'
import { combo } from '@rhythm/game/scoring'
import { endGame } from '@rhythm/game/end'
import { GameStatus, Tags, gamePlayer, boothListeners, status, voidPark } from '@rhythm/game/state'
import { ticking } from '@shared'
import { boothReturn } from '@rhythm/config/internal/derived'

const isSneaking = Predicate('is_sneaking', {
	condition: 'minecraft:entity_properties',
	entity: 'this',
	predicate: { flags: { is_sneaking: true } },
} as any)

export const wallLives = Objective.create('rhythm.wall.lives', 'dummy')
export const hitsTaken = Objective.create('rhythm.hits', 'dummy')
export const hitTick = Variable(0)
export const wallHitCooldown = Objective.create('rhythm.wall.hit_cooldown', 'dummy')

const flashPhase = Objective.create('snd.flash_phase')

const breakNearbyWall = MCFunction(
	'sections/rhythm/collision/break_wall',
	() => {
		execute.at('@s').run(() => {
			execute.as(Selector('@e', { tag: Tags.WALL, distance: [0, walls.breakRadius] })).run(() => {
				wallAge('@s').set(wallMovement.lifetime + 1)
				tp('@s', abs(...voidPark))
			})
			playsound('minecraft:block.glass.break', 'master', boothListeners, '~ ~ ~', 2.0, 1.0)
			particle('minecraft:block{block_state:"minecraft:white_stained_glass"}', rel(0, 0.5, 0), [0.5, 0.5, 0.5], 0.1, 20)
		})
	},
	{ lazy: true },
)

const deathSound = MCFunction(
	'sections/rhythm/collision/death_sound',
	() => {
		execute.as(gamePlayer).at('@s').run.playsound('minecraft:entity.player.hurt', 'master', '@s', '~ ~ ~', 1.0, 0.5)
	},
	{ lazy: true },
)

const onHit = MCFunction(
	'sections/rhythm/collision/hit',
	() => {
		wallLives('@s').remove(1)
		hitsTaken('@s').add(1)
		combo('@s').set(0)

		hitTick.set(1)
		breakNearbyWall()
		playsound('minecraft:entity.player.hurt', 'master', '@s')

		tag('@s').add(Tags.WALL_HIT_COOLDOWN)
		wallHitCooldown('@s').set(walls.cooldownTicks)
		effect.give('@s', 'minecraft:invisibility', 1, 0, true)

		_.if(wallLives('@s').lessThanOrEqualTo(0), () => {
			effect.clear('@s')
			title('@s').actionbar({ text: 'You died! Better luck next time.', color: 'red' })
			const [x, y, z] = boothReturn
			tp('@s', abs(x, y, z))
			endGame()
			// 1t later so endGame's stopsound doesn't cut it
			deathSound.schedule.function('1t', 'replace')
		})
	},
	{ lazy: true },
)

export const collisionTick = MCFunction(
	'sections/rhythm/collision/tick',
	() => {
		_.if(status.equalTo(GameStatus.ACTIVE), () => {
			hitTick.set(0)

			execute.as(Selector('@a', { tag: Tags.WALL_HIT_COOLDOWN })).run(() => {
				wallHitCooldown('@s').remove(1)
				_.if(wallHitCooldown('@s').lessThanOrEqualTo(0), () => {
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

			execute
				.as(gamePlayer)
				.at('@s')
				.run(() => {
					_.if(
						_.and(
							_.not(_.entity(Selector('@s', { tag: Tags.WALL_HIT_COOLDOWN }))),
							_.entity(Selector('@e', { tag: [Tags.WALL_HIT, `!${Tags.PARKOUR}`], distance: [0, walls.hitRadius] })),
						),
						() => {
							onHit()
						},
					)
				})

			execute
				.as(
					Selector('@a', {
						tag: [Tags.PLAYER, `!${Tags.WALL_HIT_COOLDOWN}`],
					}),
				)
				.at('@s')
				.unless.predicate(isSneaking)
				.positioned(rel(0, 1, 0))
				.if.entity(Selector('@e', { tag: [Tags.WALL_HIT, `!${Tags.PARKOUR}`], distance: [0, walls.hitRadius] }))
				.run(() => {
					onHit()
				})
		})
	},
	{ lazy: true },
)
