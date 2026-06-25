import { _, abs, data, Data, execute, kill, MCFunction, NBT, Objective, particle, raw, Selector, tag, tp } from 'sandstone'
import { PATTERN_WIDTH, PATTERN_HEIGHT, WALL_TRAVEL_TICKS, WALL_REACH_TICKS, WALL_LIFETIME, WALL_TRAVEL_DISTANCE, MOVE_NUMERATOR, MOVE_SCALE } from '../../config/obstacle-pool'
import { arena } from '../../config/arena'
import { wallAge, wallDepth } from './spawning'
import { GameStatus, Tags, status } from '../state'
import { DIM, state } from '../../../../shared'

const wallTicking = Objective.create('rhythm.wall_tick')

const wallPos = Objective.create('rhythm.wall.pos', 'dummy')
const wallMoveTemp = Objective.create('rhythm.wall.temp', 'dummy')

const moveNumerator = wallTicking('$numerator')
const travelTicks = wallTicking('$travel')

MCFunction('sections/rhythm/wall/init_scores', () => {
	moveNumerator.set(MOVE_NUMERATOR)
	travelTicks.set(WALL_TRAVEL_TICKS)
}, { runOnLoad: true })

export const beatFlag = state('$beat_flag')

const widthOnX = arena.posPath === 'Pos[2]'

const initWalls = MCFunction('sections/rhythm/wall/init', () => {
	execute.as(Selector('@e', { tag: [Tags.WALL, Tags.WALL_INIT, `!${Tags.WALL_HIT}`, `!${Tags.PARKOUR}`] })).run(() => {
		data.merge.entity('@s', {
			interpolation_duration: NBT.int(WALL_TRAVEL_TICKS),
			transformation: { translation: NBT.float([0, 0, -WALL_TRAVEL_DISTANCE]) },
			start_interpolation: NBT.int(-2),
		})
	})
	execute.as(Selector('@e', { tag: [Tags.WALL, Tags.WALL_INIT, Tags.PARKOUR] })).run(() => {
		data.merge.entity('@s', {
			interpolation_duration: NBT.int(WALL_TRAVEL_TICKS),
			transformation: { translation: NBT.float([-0.5, 0, -0.5 - WALL_TRAVEL_DISTANCE]) },
			start_interpolation: NBT.int(-2),
		})
	})
}, { lazy: true })

// TODO: We're moving an entity, we should be editing its position nbt or (better) moving it with static tp command(s)
// Also, for future reference, see: https://sandstone.dev/docs/features/macros
const tpWall = MCFunction('sections/rhythm/wall/tp', () => {
	raw('$tp @s ~ ~ $(pos)')
}, { lazy: true })

const moveWalls = MCFunction('sections/rhythm/wall/move', () => {
	execute.as(Selector('@e', { tag: [Tags.WALL, Tags.WALL_HIT, `!${Tags.WALL_INIT}`, `!${Tags.WALL_WAIT}`] })).at('@s').run(() => {
		wallMoveTemp('@s').set(wallAge('@s'))
		wallMoveTemp('@s').multiply(moveNumerator)
		wallMoveTemp('@s').divide(travelTicks)
		wallPos('@s').set(arena.spawnScaled)
		wallPos('@s').remove(wallMoveTemp('@s'))
		wallPos('@s').add(wallDepth('@s'))
		// For future reference, this can be done with this: Data('storage', 'ssb.rhythm:temp', 'pos').set(wallPos('@s'), 'double', 0.001)
		execute.store.result.storage('ssb.rhythm:temp', 'pos', 'double', 0.001)
			.run.scoreboard.players.get('@s', wallPos.name)
		raw('function sandstone_summit_booth:sections/rhythm/wall/tp with storage ssb.rhythm:temp')
	})
}, { lazy: true })

MCFunction('sections/rhythm/wall/tick', () => {
	_.if(status.equalTo(GameStatus.ACTIVE), () => {
		execute.in(DIM).run(() => {
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

			_.if(_.entity(Selector('@e', { tag: Tags.WALL, scores: { [wallAge.name]: [WALL_REACH_TICKS, WALL_REACH_TICKS] } })), () => {
				beatFlag.set(1)
			})

			execute.as(Selector('@e', { tag: Tags.WALL, scores: { [wallAge.name]: [WALL_LIFETIME, WALL_LIFETIME] } })).run(() => {
				tp('@s', abs(0, -64, 0))
			})
			kill(Selector('@e', { tag: Tags.WALL, scores: { [wallAge.name]: [WALL_LIFETIME + 1, Infinity] } }))
		})
	})
}, { runEveryTick: true })
