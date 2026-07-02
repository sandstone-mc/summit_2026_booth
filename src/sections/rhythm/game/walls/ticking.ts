import { _, abs, data, execute, kill, MCFunction, NBT, Objective, particle, raw, Selector, tag, tp } from 'sandstone'
import { wallMovement } from '@rhythm/config/internal/derived'
import { arena } from '@rhythm/config/internal/arena'
import { wallAge, wallDepth } from './spawning'
import { GameStatus, Tags, status } from '@rhythm/game/state'
import { DIMENSION, NAMESPACE, state } from '@shared'

const wallMovementObj = Objective.create('rhythm.wall.move')

const wallPos = Objective.create('rhythm.wall.pos', 'dummy')
const wallPositionTemp = Objective.create('rhythm.wall.temp', 'dummy')

const numeratorScore = wallMovementObj('$numerator')
const travelTicksScore = wallMovementObj('$travel')

MCFunction('sections/rhythm/wall/init_scores', () => {
	numeratorScore.set(wallMovement.moveNumerator)
	travelTicksScore.set(wallMovement.travelTicks)
}, { runOnLoad: true })

export const beatFlag = state('$beat_flag')

const initWalls = MCFunction('sections/rhythm/wall/init', () => {
	execute.as(Selector('@e', { tag: [Tags.WALL, Tags.WALL_INIT, `!${Tags.WALL_HIT}`, `!${Tags.PARKOUR}`] })).run(() => {
		data.merge.entity('@s', {
			interpolation_duration: NBT.int(wallMovement.travelTicks),
			transformation: {
				translation: NBT.float(arena.interpolationTranslation),
				left_rotation: NBT.float(arena.wallRotation),
				scale: NBT.float(arena.wallScale),
				right_rotation: NBT.float([0, 0, 0, 1]),
			},
			start_interpolation: NBT.int(-2),
		})
	})
	execute.as(Selector('@e', { tag: [Tags.WALL, Tags.WALL_INIT, Tags.PARKOUR] })).run(() => {
		const pkTrans: [number, number, number] = arena.wallsTravelAlongZ
			? [-0.5, 0, -0.5 + arena.travelSign * wallMovement.totalDistance]
			: [-0.5 + arena.travelSign * wallMovement.totalDistance, 0, -0.5]
		data.merge.entity('@s', {
			interpolation_duration: NBT.int(wallMovement.travelTicks),
			transformation: { translation: NBT.float(pkTrans) },
			start_interpolation: NBT.int(-2),
		})
	})
}, { lazy: true })

const tpWall = MCFunction('sections/rhythm/wall/tp', () => {
	raw(arena.wallsTravelAlongZ ? '$tp @s ~ ~ $(pos)' : '$tp @s $(pos) ~ ~')
}, { lazy: true })

const travelSignScore = wallMovementObj('$tsign')

MCFunction('sections/rhythm/wall/init_travel_sign', () => {
	travelSignScore.set(arena.travelSign)
}, { runOnLoad: true })

const moveWalls = MCFunction('sections/rhythm/wall/move', () => {
	execute.as(Selector('@e', { tag: [Tags.WALL, Tags.WALL_HIT, `!${Tags.WALL_INIT}`, `!${Tags.WALL_WAIT}`] })).at('@s').run(() => {
		wallPositionTemp('@s').set(wallAge('@s'))
		wallPositionTemp('@s').multiply(numeratorScore)
		wallPositionTemp('@s').divide(travelTicksScore)
		wallPositionTemp('@s').multiply(travelSignScore)
		wallPos('@s').set(arena.spawnScaled)
		wallPos('@s').add(wallPositionTemp('@s'))
		wallPos('@s').add(wallDepth('@s'))
		execute.store.result.storage('ssb.rhythm:temp', 'pos', 'double', 0.001)
			.run.scoreboard.players.get('@s', wallPos.name)
		raw(`function ${NAMESPACE}:sections/rhythm/wall/tp with storage ssb.rhythm:temp`)
	})
}, { lazy: true })

MCFunction('sections/rhythm/wall/tick', () => {
	_.if(status.equalTo(GameStatus.ACTIVE), () => {
		execute.in(DIMENSION).run(() => {
			initWalls()

			execute.as(Selector('@e', { tag: [Tags.WALL, Tags.WALL_INIT] })).run(() => {
				wallAge('@s').set(2)
				tag('@s').remove(Tags.WALL_INIT)
			})

			execute.as(Selector('@e', { tag: Tags.WALL_WAIT })).run(() => {
				tag('@s').add(Tags.WALL_INIT)
				tag('@s').remove(Tags.WALL_WAIT)
			})

			execute.as(Selector('@e', { tag: Tags.WALL_NEW })).run(() => {
				tag('@s').add(Tags.WALL_WAIT)
				tag('@s').remove(Tags.WALL_NEW)
			})

			execute.as(Selector('@e', { type: 'minecraft:item_display', tag: Tags.WALL })).at('@s').run(() => {
				particle('minecraft:flame', '~ ~ ~', [0, 0, 0], 0, 1)
			})

			moveWalls()

			execute.as(Selector('@e', { tag: [Tags.WALL, `!${Tags.WALL_INIT}`, `!${Tags.WALL_WAIT}`] })).run(() => {
				wallAge('@s').add(1)
			})

			_.if(_.entity(Selector('@e', { tag: Tags.WALL, scores: { [wallAge.name]: [wallMovement.reachTicks, wallMovement.reachTicks] } })), () => {
				beatFlag.set(1)
			})

			execute.as(Selector('@e', { tag: Tags.WALL, scores: { [wallAge.name]: [wallMovement.lifetime, wallMovement.lifetime] } })).run(() => {
				tp('@s', abs(0, -64, 0))
			})
			kill(Selector('@e', { tag: Tags.WALL, scores: { [wallAge.name]: [wallMovement.lifetime + 1, Infinity] } }))
		})
	})
}, { runEveryTick: true })
