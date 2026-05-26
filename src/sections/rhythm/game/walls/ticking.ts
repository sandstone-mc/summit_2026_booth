import { _, abs, data, Data, execute, kill, MCFunction, NBT, Objective, raw, Selector, tag, tp } from 'sandstone'
import { WALL_TRAVEL_TICKS, WALL_REACH_TICKS, WALL_LIFETIME, MOVE_NUMERATOR, MOVE_SCALE } from '../../config/obstacle-pool'
import { arena } from '../../config/arena'
import { wallAge, wallDepth } from './spawning'
import { GameState, Tags, gameState } from '../state'
import { DIM } from '../../../../shared'

const wallPos = Objective.create('ssb_wz', 'dummy')
const wallMoveTemp = Objective.create('ssb_wmt', 'dummy')
const moveNum = Objective.create('ssb_mn', 'dummy')
const moveNumScore = moveNum('$num')
const travelScore = Objective.create('ssb_wtt', 'dummy')
const travelTicksScore = travelScore('$ticks')

MCFunction('sections/rhythm/wall/init_scores', () => {
	moveNumScore.set(MOVE_NUMERATOR)
	travelTicksScore.set(WALL_TRAVEL_TICKS)
}, { runOnLoad: true })

export const beatFlag = Objective.create('ssb_bf', 'dummy')
export const beatFlagScore = beatFlag('$beat')

const initWalls = MCFunction('sections/rhythm/wall/init', () => {
	execute.as(Selector('@e', { tag: [Tags.WALL, Tags.WALL_INIT, `!${Tags.WALL_HIT}`] })).run(() => {
		data.merge.entity('@s', {
			interpolation_duration: NBT.int(WALL_TRAVEL_TICKS),
			transformation: { translation: NBT.float(arena.interpolationTranslation) },
			start_interpolation: NBT.int(-2),
		})
	})
}, { lazy: true })

const tpWall = MCFunction('sections/rhythm/wall/tp', () => {
	raw('$tp @s ~ ~ $(pos)')
}, { lazy: true })

const moveWalls = MCFunction('sections/rhythm/wall/move', () => {
	execute.as(Selector('@e', { tag: [Tags.WALL, Tags.WALL_HIT, `!${Tags.WALL_INIT}`, `!${Tags.WALL_WAIT}`] })).at('@s').run(() => {
		wallMoveTemp('@s').set(wallAge('@s'))
		wallMoveTemp('@s').multiply(moveNumScore)
		wallMoveTemp('@s').divide(travelTicksScore)
		wallPos('@s').set(arena.spawnScaled)
		wallPos('@s').remove(wallMoveTemp('@s'))
		wallPos('@s').add(wallDepth('@s'))
		execute.store.result.storage('ssb:temp', 'pos', 'double', 0.001)
			.run.scoreboard.players.get('@s', wallPos.name)
		raw('function sandstone_summit_booth:sections/rhythm/wall/tp with storage ssb:temp')
	})
}, { lazy: true })

MCFunction('sections/rhythm/wall/tick', () => {
	_.if(gameState.equalTo(GameState.ACTIVE), () => {
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

			moveWalls()

			execute.as(Selector('@e', { tag: [Tags.WALL, `!${Tags.WALL_INIT}`, `!${Tags.WALL_WAIT}`] })).run(() => {
				wallAge('@s').add(1)
			})

			_.if(_.entity(Selector('@e', { tag: Tags.WALL, scores: { [wallAge.name]: [WALL_REACH_TICKS, WALL_REACH_TICKS] } })), () => {
				beatFlagScore.set(1)
			})

			execute.as(Selector('@e', { tag: Tags.WALL, scores: { [wallAge.name]: [WALL_LIFETIME, WALL_LIFETIME] } })).run(() => {
				tp('@s', abs(0, -10, 0))
			})
			kill(Selector('@e', { tag: Tags.WALL, scores: { [wallAge.name]: [WALL_LIFETIME + 2, Infinity] } }))
		})
	})
}, { runEveryTick: true })
