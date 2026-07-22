import {
	_,
	abs,
	data,
	execute,
	kill,
	MCFunction,
	NBT,
	Objective,
	particle,
	raw,
	Selector,
	tag,
	tp,
	Variable,
} from 'sandstone'
import { wallMovement } from '@rhythm/config/internal/derived'
import { arena } from '@rhythm/config/internal/arena'
import { wallAge, wallDepth } from './spawning'
import { GameStatus, Tags, gamePlayer, interpSetting, status, voidPark } from '@rhythm/game/state'
import { NAMESPACE, ticking } from '@shared'
import { calibrationDepth } from '../..';

const wallPos = Objective.create('rhythm.wall.pos', 'dummy')
const wallPositionTemp = Objective.create('rhythm.wall.temp', 'dummy')

const numeratorScore = Variable(wallMovement.moveNumerator)
const travelTicksScore = Variable(wallMovement.travelTicks)

export const beatFlag = Variable(0)

const initWalls = MCFunction(
	'sections/rhythm/wall/init',
	() => {
		_.if(interpSetting.equalTo(0), () => {
			execute
				.as(Selector('@e', { tag: [Tags.WALL, Tags.WALL_INIT, `!${Tags.WALL_HIT}`, `!${Tags.PARKOUR}`] }))
				.run(() => {
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
				const pkTrans: [number, number, number] = [-0.5, 0, -0.5 + wallMovement.totalDistance]
				data.merge.entity('@s', {
					interpolation_duration: NBT.int(wallMovement.travelTicks),
					transformation: { translation: NBT.float(pkTrans) },
					start_interpolation: NBT.int(-2),
				})
			})
		})
	},
	{ lazy: true },
)

const TEMP_STORAGE = `${NAMESPACE}:temp`

const tpWall = MCFunction(
	'sections/rhythm/wall/tp',
	() => {
		raw('$tp @s ~ ~ $(pos)')
	},
	{ lazy: true },
)

const moveWalls = MCFunction(
	'sections/rhythm/wall/move',
	() => {
		const moveBody = () => {
			wallPositionTemp('@s').set(wallAge('@s'))
			_.if(wallPositionTemp('@s').greaterThan(travelTicksScore), () => {
				wallPositionTemp('@s').set(travelTicksScore)
			})
			wallPositionTemp('@s').multiply(numeratorScore)
			wallPositionTemp('@s').divide(travelTicksScore)
			wallPos('@s').set(arena.spawnScaled)
			wallPos('@s').add(wallPositionTemp('@s'))
			wallPos('@s').add(wallDepth('@s'))
			execute.store.result.storage(TEMP_STORAGE, 'pos', 'double', 0.001).run.scoreboard.players.get('@s', wallPos.name)
			raw(`function ${tpWall.name} with storage ${TEMP_STORAGE}`)
		}
		execute
			.as(Selector('@e', { tag: [Tags.WALL, Tags.WALL_HIT, `!${Tags.WALL_INIT}`, `!${Tags.WALL_WAIT}`] }))
			.at('@s')
			.run(moveBody)
		_.if(interpSetting.equalTo(1), () => {
			execute
				.as(Selector('@e', { tag: [Tags.WALL, `!${Tags.WALL_HIT}`, `!${Tags.WALL_INIT}`, `!${Tags.WALL_WAIT}`] }))
				.at('@s')
				.run(moveBody)
		})
		// execute.as(Selector('@e', { type: 'minecraft:happy_ghast', tag: Tags.WALL })).run.rotate('@s', ['0', '0'])
	},
	{ lazy: true },
)

export const wallTick = MCFunction(
	'sections/rhythm/wall/tick',
	() => {
		_.if(status.equalTo(GameStatus.ACTIVE), () => {
			initWalls()

			execute.as(Selector('@e', { tag: [Tags.WALL, Tags.WALL_INIT, `!${Tags.PARKOUR}`] })).run(() => {
				wallDepth('@s').set(calibrationDepth)
			})
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

			_.if(
				_.entity(
					Selector('@e', {
						tag: Tags.WALL,
						scores: { [wallAge.name]: [wallMovement.beatReachTicks, wallMovement.beatReachTicks] },
					}),
				),
				() => {
					beatFlag.set(1)
				},
			)

			execute
				.as(
					Selector('@e', {
						tag: Tags.WALL,
						scores: { [wallAge.name]: [wallMovement.lifetime, wallMovement.lifetime] },
					}),
				)
				.run(() => {
					tp('@s', abs(...voidPark))
				})
			kill(Selector('@e', { tag: Tags.WALL, scores: { [wallAge.name]: [wallMovement.lifetime + 1, Infinity] } }))
		})
	},
	{ lazy: true },
)
