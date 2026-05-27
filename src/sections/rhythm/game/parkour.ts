import { _, abs, execute, kill, MCFunction, NBT, Objective, playsound, scoreboard, Selector, summon, tag, title } from 'sandstone'
import { WALL_TRAVEL_TICKS, WALL_REACH_TICKS } from '../config/obstacle-pool'
import { PARKOUR_BONUS, PARKOUR_PATH_COUNT, PARKOUR_PATHS, PARKOUR_STEP_COUNT, STEP_GLASS, STEP_LENGTHS } from '../config/parkour-paths'
import { arena } from '../config/arena'
import { wallAge } from './walls/spawning'
import { wallLives, wallHitCooldown } from './walls/collision'
import { points, combo } from './scoring'
import { GameStatus, Tags, alivePlayers, status } from './state'
import { DIM } from '../../../shared'

const parkour = Objective.create('rhythm.parkour')
const pkPath = parkour('$path')
const pkActive = parkour('$active')
const pkTemp = parkour('$temp')
const pkRewardY = parkour('$y')

MCFunction('sections/rhythm/parkour_init', () => {
	pkActive.set(0)
}, { runOnLoad: true })

const [originX, originY, originZ] = arena.spawnOrigin
const widthOnX = arena.posPath === 'Pos[2]'

export const stepDispatchFns = Array.from({ length: PARKOUR_STEP_COUNT }, (_v, step) => {
	return MCFunction(`sections/rhythm/parkour/step_${step}`, () => {
		if (step === 0) {
			execute.store.result.score(pkPath.target, pkPath.objective)
				.run.random.value([0, PARKOUR_PATH_COUNT - 1], 'pk_path')
			pkActive.set(1)
			execute.in(DIM).as(alivePlayers).run(() => {
				tag('@s').add(Tags.WALL_CD)
				wallHitCooldown('@s').set(30)
			})
		}

		const buildPathBlock = (p: number) => () => {
			const [gx, gy] = PARKOUR_PATHS[p][step]
			const platLen = STEP_LENGTHS[step]
			const isRewardStep = step === PARKOUR_STEP_COUNT - 1

			if (isRewardStep) pkRewardY.set((originY + gy - 1) * 10)

			let posX: number, posY: number, posZ: number
			if (widthOnX) {
				posX = originX + gx; posY = originY + gy; posZ = originZ
			} else {
				posX = originX; posY = originY + gy; posZ = originZ + gx
			}

			const [ix, iy, iz] = arena.initialTranslation
			let scale: [number, number, number]
			let translation: [number, number, number]
			if (widthOnX) {
				scale = [1, 1, platLen]
				translation = [ix, iy, iz - (platLen - 1) / 2]
			} else {
				scale = [platLen, 1, 1]
				translation = [ix - (platLen - 1) / 2, iy, iz]
			}

			execute.in(DIM).run(() => {
				summon('minecraft:block_display', abs(posX, posY, posZ), {
					Tags: [Tags.WALL, Tags.WALL_NEW, Tags.PARKOUR],
					block_state: { Name: STEP_GLASS[step] },
					interpolation_duration: NBT.int(WALL_TRAVEL_TICKS),
					transformation: {
						translation: NBT.float(translation),
						left_rotation: NBT.float([0, 0, 0, 1]),
						scale: NBT.float(scale),
						right_rotation: NBT.float([0, 0, 0, 1]),
					},
				})

				for (let i = 0; i < platLen; i++) {
					const ghastTags: string[] = isRewardStep
						? [Tags.WALL, Tags.WALL_HIT, Tags.WALL_NEW, Tags.WALL_GHAST, Tags.PARKOUR, Tags.PK_REWARD, Tags.PK_FRESH]
						: [Tags.WALL, Tags.WALL_HIT, Tags.WALL_NEW, Tags.WALL_GHAST, Tags.PARKOUR, Tags.PK_FRESH]
					if (i === Math.floor(platLen / 2)) ghastTags.push(Tags.PK_TRIGGER)

					summon('minecraft:happy_ghast', abs(posX, posY, posZ), {
						Tags: ghastTags,
						NoAI: NBT.byte(1), NoGravity: NBT.byte(1), Invulnerable: NBT.byte(1), Silent: NBT.byte(1),
						attributes: [{ id: 'minecraft:scale', base: 0.25 }],
					})

					const ageOffset = (i * 2 - (platLen - 1)) * arena.travelSign + 2
					wallAge(Selector('@e', { tag: Tags.PK_FRESH, limit: 1, sort: 'nearest' })).set(ageOffset)
					tag(Selector('@e', { tag: Tags.PK_FRESH })).remove(Tags.PK_FRESH)
				}
			})
		}

		let chain = _.if(pkPath.equalTo(0), buildPathBlock(0))
		for (let p = 1; p < PARKOUR_PATH_COUNT; p++) {
			chain = chain.elseIf(pkPath.equalTo(p), buildPathBlock(p))
		}
	}, { lazy: true })
})

export const parkourCleanup = MCFunction('sections/rhythm/parkour/cleanup', () => {
	pkActive.set(0)
	execute.in(DIM).run.kill(Selector('@e', { tag: Tags.PARKOUR }))
	tag('@a').remove(Tags.PK_DONE)
}, { lazy: true })

MCFunction('sections/rhythm/parkour/tick', () => {
	_.if(_.and(status.equalTo(GameStatus.ACTIVE), pkActive.greaterThan(0)), () => {
		execute.in(DIM).run(() => {
			const reach = WALL_REACH_TICKS + 2
			_.if(_.entity(Selector('@e', {
				tag: Tags.PK_TRIGGER,
				scores: { [wallAge.name]: [reach, reach] },
			})), () => {
				execute.as('@a').at('@s').run.playsound(
					'minecraft:block.note_block.hat', 'master', '@s', '~ ~ ~', 1.0, 1.0,
				)
			})

			execute.as(Selector('@a', {
				tag: [Tags.ALIVE, Tags.PLAYER, `!${Tags.PK_DONE}`],
			})).at('@s').run(() => {
				execute.store.result.score(pkTemp.target, pkTemp.objective)
					.run.data.get.entity('@s', 'Pos[1]', 10)
				_.if(_.and(
					_.entity(Selector('@e', { tag: Tags.PK_REWARD, distance: [0, 2.5] })),
					pkTemp.greaterOrEqualThan(pkRewardY),
				), () => {
					wallLives('@s').add(1)
					points('@s').add(PARKOUR_BONUS)
					_.if(combo('@s').lessThan(10), () => { combo('@s').set(10) })

					tag('@s').add(Tags.WALL_CD)
					wallHitCooldown('@s').set(60)

					playsound('minecraft:entity.player.levelup', 'master', '@s')
					title('@s').title({ text: '' })
					title('@s').subtitle([
						{ text: 'Parkour Complete! ', color: 'green' },
						{ text: '+1❤ ', color: 'red' },
						{ text: `+${PARKOUR_BONUS}pts `, color: 'aqua' },
						{ text: '+Immunity!', color: 'light_purple' },
					])
					tag('@s').add(Tags.PK_DONE)
				})
			})
		})
	})
}, { runEveryTick: true })
