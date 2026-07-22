import {
	_,
	abs,
	Data,
	execute,
	kill,
	MCFunction,
	NBT,
	playsound,
	Selector,
	summon,
	tag,
	title,
	Variable,
} from 'sandstone'
import { collisions, walls } from '@rhythm/config'
import { wallMovement } from '@rhythm/config/internal/derived'
import {
	PARKOUR_BONUS,
	PARKOUR_PATH_COUNT,
	PARKOUR_PATHS,
	PARKOUR_STEP_COUNT,
	STEP_GLASS,
	STEP_LENGTH,
} from '@rhythm/config/parkour-paths'
import { arena } from '@rhythm/config/internal/arena'
import { wallAge, wallDepth } from './walls/spawning'
import { wallLives, wallHitCooldown } from './walls/collision'
import { points, combo } from './scoring'
import { GameStatus, Tags, boothTags, gamePlayer, status } from './state'
import { scoreSwitch } from '@rhythm/flow'
import { ticking } from '@shared'
import { calibrationDepth } from '..'

const PARKOUR_IMMUNITY_TICKS = 61

const pathChoice = Variable(0)
const parkourRunning = Variable(0)
const playerY = Variable(0)
const rewardY = Variable(0)
const pkDone = Variable(0)

const [originX, originY, originZ] = arena.spawnOrigin

export const stepDispatchFns = Array.from({ length: PARKOUR_STEP_COUNT }, (_v, step) => {
	return MCFunction(
		`sections/rhythm/parkour/step_${step}`,
		() => {
			if (step === 0) {
				execute.store.result.score(pathChoice).run.random.value([0, PARKOUR_PATH_COUNT - 1], 'pk_path')
				parkourRunning.set(1)
				execute.as(gamePlayer).run(() => {
					tag('@s').add(Tags.WALL_HIT_COOLDOWN)
					wallHitCooldown('@s').set(walls.cooldownTicks)
				})
			}

			const buildPathBlock = (p: number) => () => {
				const [gx, gy] = PARKOUR_PATHS[p][step]
				const platLen = STEP_LENGTH
				const isRewardStep = step === PARKOUR_STEP_COUNT - 1

				if (isRewardStep) rewardY.set((originY + gy - 1) * 10)

				const posX = originX + gx
				const posY = originY + gy
				const posZ = originZ

				const [ix, iy, iz] = arena.initialTranslation
				const scale: [number, number, number] = [1, 1, platLen]
				const translation: [number, number, number] = [ix, iy, iz - (platLen - 1) / 2]

				summon('minecraft:block_display', abs(posX, posY, posZ), {
					Tags: boothTags(Tags.WALL, Tags.WALL_NEW, Tags.PARKOUR),
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
					const ghastTags = isRewardStep
						? [Tags.WALL, Tags.WALL_HIT, Tags.WALL_NEW, Tags.PARKOUR, Tags.PARKOUR_REWARD, Tags.PARKOUR_FRESH]
						: [Tags.WALL, Tags.WALL_HIT, Tags.WALL_NEW, Tags.PARKOUR, Tags.PARKOUR_FRESH]
					if (i === Math.floor(platLen / 2)) ghastTags.push(Tags.PARKOUR_TRIGGER)

					summon('minecraft:happy_ghast', abs(posX, posY, posZ), {
						Tags: boothTags(...ghastTags),
						NoAI: true,
						NoGravity: true,
						Invulnerable: true,
						Silent: true,
						attributes: [{ id: 'minecraft:scale', base: 0.25 }],
						active_effects: [{ id: 'minecraft:invisibility', duration: NBT.int(-1), show_particles: false }],
					})

					const spacingAge = i * 2 - platLen + 2 + collisions.parkourLead * 2
					const depthOffset = Math.round((spacingAge * wallMovement.moveNumerator) / wallMovement.travelTicks)
					wallDepth(Selector('@e', { tag: Tags.PARKOUR_FRESH, limit: 1, sort: 'nearest' })).set(depthOffset)
					wallDepth(Selector('@e', { tag: Tags.PARKOUR_FRESH, limit: 1, sort: 'nearest' })).add(calibrationDepth)
					tag(Selector('@e', { tag: Tags.PARKOUR_FRESH })).remove(Tags.PARKOUR_FRESH)
				}
			}

			scoreSwitch(
				pathChoice,
				PARKOUR_PATHS.map((_path, p) => [p, buildPathBlock(p)]),
			)
		},
		{ lazy: true },
	)
})

export const parkourCleanup = MCFunction(
	'sections/rhythm/parkour/cleanup',
	() => {
		parkourRunning.set(0)
		kill(Selector('@e', { tag: Tags.PARKOUR }))
		pkDone.set(0)
	},
	{ lazy: true },
)

export const parkourTick = MCFunction(
	'sections/rhythm/parkour/tick',
	() => {
		_.if(_.and(status.equalTo(GameStatus.ACTIVE), parkourRunning.greaterThan(0)), () => {
			const reach = wallMovement.beatReachTicks
			_.if(
				_.entity(
					Selector('@e', {
						tag: Tags.PARKOUR_TRIGGER,
						scores: { [wallAge.name]: [reach, reach] },
					}),
				),
				() => {
					execute.as(gamePlayer).at('@s').run.playsound('minecraft:block.note_block.hat', 'master', '@s')
				},
			)

			execute.if
				.score(pkDone, 'matches', 0)
				.as(gamePlayer)
				.at('@s')
				.run(() => {
					playerY.set(Data('entity', '@s', 'Pos[1]'), 10)
					_.if(
						_.and(
							playerY.greaterThanOrEqualTo(rewardY),
							_.entity(Selector('@e', { tag: Tags.PARKOUR_REWARD, distance: [0, 2.5] })),
						),
						() => {
							wallLives('@s').add(1)
							points('@s').add(PARKOUR_BONUS)
							_.if(combo('@s').lessThan(10), () => {
								combo('@s').set(10)
							})

							tag('@s').add(Tags.WALL_HIT_COOLDOWN)
							wallHitCooldown('@s').set(PARKOUR_IMMUNITY_TICKS)

							playsound('minecraft:entity.player.levelup', 'master', '@s')
							title('@s').title({ text: '' })
							title('@s').subtitle([
								{ text: 'Parkour Complete! ', color: 'green' },
								{ text: '+1❤ ', color: 'red' },
								{ text: `+${PARKOUR_BONUS}pts `, color: 'aqua' },
								{ text: '+Immunity!', color: 'light_purple' },
							])
							pkDone.set(1)
						},
					)
				})
		})
	},
	{ lazy: true },
)
