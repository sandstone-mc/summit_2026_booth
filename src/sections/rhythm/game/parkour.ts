import { _, abs, execute, kill, MCFunction, NBT, Objective, playsound, scoreboard, Selector, summon, tag, title } from 'sandstone'
import { walls } from '@rhythm/config'
import { wallMovement } from '@rhythm/config/internal/derived'
import { PARKOUR_BONUS, PARKOUR_PATH_COUNT, PARKOUR_PATHS, PARKOUR_STEP_COUNT, STEP_GLASS, STEP_LENGTHS } from '@rhythm/config/parkour-paths'
import { arena } from '@rhythm/config/internal/arena'
import { wallAge, wallDepth } from './walls/spawning'
import { wallLives, wallHitCooldown } from './walls/collision'
import { points, combo } from './scoring'
import { GameStatus, Tags, alivePlayers, status } from './state'
import { DIMENSION } from '@shared'

const parkour = Objective.create('rhythm.parkour')
const pkPath = parkour('$path')
const pkActive = parkour('$active')
const pkTemp = parkour('$temp')
const pkRewardY = parkour('$y')

MCFunction('sections/rhythm/parkour_init', () => {
	pkActive.set(0)
}, { runOnLoad: true })

const [originX, originY, originZ] = arena.spawnOrigin
const widthOnX = arena.wallsTravelAlongZ

export const stepDispatchFns = Array.from({ length: PARKOUR_STEP_COUNT }, (_v, step) => {
	return MCFunction(`sections/rhythm/parkour/step_${step}`, () => {
		if (step === 0) {
			execute.store.result.score(pkPath.target, pkPath.objective)
				.run.random.value([0, PARKOUR_PATH_COUNT - 1], 'pk_path')
			pkActive.set(1)
			execute.in(DIMENSION).as(alivePlayers).run(() => {
				tag('@s').add(Tags.WALL_HIT_COOLDOWN)
				wallHitCooldown('@s').set(walls.cooldownTicks)
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

			execute.in(DIMENSION).run(() => {
				summon('minecraft:block_display', abs(posX, posY, posZ), {
					Tags: [Tags.WALL, Tags.WALL_NEW, Tags.PARKOUR],
					block_state: { Name: STEP_GLASS[step] },
					interpolation_duration: NBT.int(wallMovement.travelTicks),
					transformation: {
						translation: NBT.float(translation),
						left_rotation: NBT.float([0, 0, 0, 1]),
						scale: NBT.float(scale),
						right_rotation: NBT.float([0, 0, 0, 1]),
					},
				})

				for (let i = 0; i < platLen; i++) {
					const ghastTags: string[] = isRewardStep
						? [Tags.WALL, Tags.WALL_HIT, Tags.WALL_NEW, Tags.WALL_GHAST, Tags.PARKOUR, Tags.PARKOUR_REWARD, Tags.PARKOUR_FRESH]
						: [Tags.WALL, Tags.WALL_HIT, Tags.WALL_NEW, Tags.WALL_GHAST, Tags.PARKOUR, Tags.PARKOUR_FRESH]
					if (i === Math.floor(platLen / 2)) ghastTags.push(Tags.PARKOUR_TRIGGER)

					summon('minecraft:happy_ghast', abs(posX, posY, posZ), {
						Tags: ghastTags,
						NoAI: NBT.byte(1), NoGravity: NBT.byte(1), Invulnerable: NBT.byte(1), Silent: NBT.byte(1),
						attributes: [{ id: 'minecraft:scale', base: 0.25 }],
					})

					const spacingAge = (i * 2 - (platLen - 1)) * arena.travelSign
					const depthOffset = spacingAge * wallMovement.moveNumerator / wallMovement.travelTicks
					wallDepth(Selector('@e', { tag: Tags.PARKOUR_FRESH, limit: 1, sort: 'nearest' })).set(depthOffset)
					tag(Selector('@e', { tag: Tags.PARKOUR_FRESH })).remove(Tags.PARKOUR_FRESH)
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
	execute.in(DIMENSION).run.kill(Selector('@e', { tag: Tags.PARKOUR }))
	tag('@a').remove(Tags.PARKOUR_DONE)
}, { lazy: true })

MCFunction('sections/rhythm/parkour/tick', () => {
	_.if(_.and(status.equalTo(GameStatus.ACTIVE), pkActive.greaterThan(0)), () => {
		execute.in(DIMENSION).run(() => {
			const reach = wallMovement.reachTicks + 2
			_.if(_.entity(Selector('@e', {
				tag: Tags.PARKOUR_TRIGGER,
				scores: { [wallAge.name]: [reach, reach] },
			})), () => {
				execute.as('@a').at('@s').run.playsound(
					'minecraft:block.note_block.hat', 'master', '@s', '~ ~ ~', 1.0, 1.0,
				)
			})

			execute.as(Selector('@a', {
				tag: [Tags.ALIVE, Tags.PLAYER, `!${Tags.PARKOUR_DONE}`],
			})).at('@s').run(() => {
				execute.store.result.score(pkTemp.target, pkTemp.objective)
					.run.data.get.entity('@s', 'Pos[1]', 10)
				_.if(_.and(
					_.entity(Selector('@e', { tag: Tags.PARKOUR_REWARD, distance: [0, 2.5] })),
					pkTemp.greaterOrEqualThan(pkRewardY),
				), () => {
					wallLives('@s').add(1)
					points('@s').add(PARKOUR_BONUS)
					_.if(combo('@s').lessThan(10), () => { combo('@s').set(10) })

					tag('@s').add(Tags.WALL_HIT_COOLDOWN)
					wallHitCooldown('@s').set(60)

					playsound('minecraft:entity.player.levelup', 'master', '@s')
					title('@s').title({ text: '' })
					title('@s').subtitle([
						{ text: 'Parkour Complete! ', color: 'green' },
						{ text: '+1❤ ', color: 'red' },
						{ text: `+${PARKOUR_BONUS}pts `, color: 'aqua' },
						{ text: '+Immunity!', color: 'light_purple' },
					])
					tag('@s').add(Tags.PARKOUR_DONE)
				})
			})
		})
	})
}, { runEveryTick: true })
