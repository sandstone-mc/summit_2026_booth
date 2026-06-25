import { _, abs, data, effect, execute, kill, MCFunction, NBT, Objective, particle, raw, schedule, Selector, summon, team, tp } from 'sandstone'
import { arena } from '../config/arena'
import { PATTERN_WIDTH, WALL_SPAWN_AHEAD, WALL_PASS_BEHIND } from '../config/obstacle-pool'
import { MAP_SIZE, LANE_X, LANE_Z, LANE_WIDTH } from '../config/maps'
import { Tags } from './state'
import { DIM, NAMESPACE } from '../../../shared'

const GLOW_COLORS = [
	'aqua', 'blue', 'green', 'yellow', 'light_purple', 'red', 'gold', 'white',
] as const

const GLOW_DURATION = 1

const glowPick = Objective.create('ssb_glp', 'dummy')
const glowPickScore = glowPick('$glow')

MCFunction('sections/rhythm/lane/teams_init', () => {
	for (const color of GLOW_COLORS) {
		team.add(`ssb_glow_${color}`)
		team.modify(`ssb_glow_${color}`, 'color', color as any)
		team.modify(`ssb_glow_${color}`, 'seeFriendlyInvisibles', false)
	}
}, { runOnLoad: true })

const laneSelector = Selector('@e', { tag: Tags.LANE })
const fragmentSelector = Selector('@e', { tag: Tags.LANE_FRAGMENT })
const borderSelector = Selector('@e', { tag: Tags.LANE_BORDER })

const [baseX, baseY, baseZ] = [arena.playAreaMin[0], arena.playAreaMin[1], 0]
const laneCenter = [baseX + Math.floor(PATTERN_WIDTH / 2), baseY + 1.5, baseZ] as const

const FRAGMENT_BLOCKS = [
	'minecraft:white_stained_glass',
	'minecraft:light_blue_stained_glass',
	'minecraft:magenta_stained_glass',
	'minecraft:cyan_stained_glass',
	'minecraft:purple_stained_glass',
	'minecraft:pink_stained_glass',
]

interface Fragment {
	pos: [number, number, number]
	scale: [number, number, number]
	rotation: [number, number, number, number]
}

const FRAGMENTS: Fragment[] = [
	{ pos: [-2.5, 3.5, 3.0], scale: [0.4, 0.25, 0.3], rotation: [0.15, 0.1, 0.05, 0.98] },
	{ pos: [6.5, 4.0, 5.0], scale: [0.2, 0.35, 0.2], rotation: [-0.1, 0.2, 0.15, 0.96] },
	{ pos: [-1.5, 6.0, 7.0], scale: [0.3, 0.3, 0.4], rotation: [0.25, -0.1, 0.2, 0.94] },
	{ pos: [7.0, 2.5, 2.0], scale: [0.35, 0.2, 0.25], rotation: [0.0, 0.3, -0.1, 0.95] },
	{ pos: [-3.0, 5.0, 9.0], scale: [0.2, 0.2, 0.2], rotation: [0.2, 0.2, 0.2, 0.94] },
	{ pos: [8.0, 5.5, 6.5], scale: [0.25, 0.4, 0.3], rotation: [-0.15, 0.0, 0.25, 0.96] },
	{ pos: [-2.0, 2.0, 5.5], scale: [0.15, 0.3, 0.15], rotation: [0.1, -0.2, 0.1, 0.97] },
	{ pos: [6.0, 7.0, 4.0], scale: [0.3, 0.15, 0.35], rotation: [0.3, 0.1, -0.05, 0.95] },
	{ pos: [-1.0, 4.5, 10.0], scale: [0.25, 0.25, 0.2], rotation: [-0.2, 0.15, 0.1, 0.96] },
	{ pos: [7.5, 3.5, 8.0], scale: [0.2, 0.3, 0.25], rotation: [0.05, -0.15, 0.3, 0.94] },
	{ pos: [5.5, 6.5, 1.5], scale: [0.35, 0.2, 0.15], rotation: [0.2, 0.25, 0.0, 0.95] },
	{ pos: [-3.5, 4.0, 6.0], scale: [0.15, 0.15, 0.3], rotation: [-0.1, 0.1, -0.2, 0.97] },
]

export const spawnLaneShulkers = MCFunction('sections/rhythm/lane/spawn', () => {
	execute.in(DIM).run(() => {
		kill(laneSelector)
		kill(fragmentSelector)
		for (let x = 0; x < PATTERN_WIDTH; x++) {
			summon('minecraft:shulker', abs(baseX + x, baseY, baseZ), {
				Tags: [Tags.LANE],
				NoAI: NBT.byte(1),
				NoGravity: NBT.byte(1),
				Invulnerable: NBT.byte(1),
				Silent: NBT.byte(1),
			})
		}
		execute.as(laneSelector).run(() => {
			effect.give('@s', 'minecraft:invisibility', 99999, 0, true)
		})

		for (let i = 0; i < FRAGMENTS.length; i++) {
			const frag = FRAGMENTS[i]
			const block = FRAGMENT_BLOCKS[i % FRAGMENT_BLOCKS.length]
			const [sx, sy, sz] = frag.scale
			summon('minecraft:block_display', abs(baseX + frag.pos[0], baseY + frag.pos[1], baseZ + frag.pos[2]), {
				Tags: [Tags.LANE_FRAGMENT],
				block_state: { Name: block },
				transformation: {
					translation: NBT.float([-sx / 2, -sy / 2, -sz / 2]),
					left_rotation: NBT.float(frag.rotation),
					scale: NBT.float([sx, sy, sz]),
					right_rotation: NBT.float([0, 0, 0, 1]),
				},
				interpolation_duration: NBT.int(4),
				brightness: { sky: NBT.int(15), block: NBT.int(15) },
			})
		}
	})
}, { lazy: true })

const LANE_LENGTH = WALL_SPAWN_AHEAD + WALL_PASS_BEHIND
const LANE_Z_MID = -WALL_PASS_BEHIND + LANE_LENGTH / 2

function argb(a: number, r: number, g: number, b: number) {
	return ((a & 0xFF) << 24 | (r & 0xFF) << 16 | (g & 0xFF) << 8 | (b & 0xFF)) | 0
}

const BORDER_STRIP_COUNT = 10
const TOTAL_HEIGHT = 1.0
const BORDER_SCALE_Y = TOTAL_HEIGHT / (BORDER_STRIP_COUNT * 0.25)
const BORDER_STEP = TOTAL_HEIGHT / BORDER_STRIP_COUNT

const BORDER_ALPHAS = Array.from({ length: BORDER_STRIP_COUNT }, (_, i) =>
	i === BORDER_STRIP_COUNT - 1 ? 5 : Math.round(180 * (1 - i / (BORDER_STRIP_COUNT - 1)) ** 2.5)
)

const BORDER_DEFAULT_RGB: [number, number, number] = [255, 40, 40]

const BORDER_COLOR_MAP: Record<string, [number, number, number]> = {
	aqua:         [85, 255, 255],
	blue:         [85, 85, 255],
	green:        [85, 255, 85],
	yellow:       [255, 255, 85],
	light_purple: [255, 85, 255],
	red:          [255, 85, 85],
	gold:         [255, 170, 0],
	white:        [255, 255, 255],
}

function borderStripTag(i: number) { return `ssb.lane.border.${i}` }

const BORDER_TEXT = '"' + ' '.repeat(500) + '"'

function wallBorderNbt(stripIndex: number, bg: number, yOff: number, facing: number, scaleX: number) {
	return {
		Tags: [Tags.LANE_BORDER, borderStripTag(stripIndex)],
		text: BORDER_TEXT,
		alignment: 'center',
		line_width: NBT.int(9999),
		text_opacity: NBT.byte(0),
		background: NBT.int(bg),
		shadow: NBT.byte(0),
		see_through: NBT.byte(1),
		billboard: 'fixed',
		Rotation: NBT.float([facing, 0]),
		transformation: {
			left_rotation: NBT.float([0, 0, 0, 1]),
			right_rotation: NBT.float([0, 0, 0, 1]),
			translation: NBT.float([0, yOff, 0]),
			scale: NBT.float([scaleX, BORDER_SCALE_Y, 1]),
		},
	}
}

const laneXMin = baseX
const laneXMax = baseX + LANE_WIDTH
const laneZMin = baseZ - LANE_Z - 2
const laneZMax = baseZ - LANE_Z + MAP_SIZE[2] + 2

const leftX = laneXMin + 0.175 - 3 / 16
const rightX = laneXMax + 0.175 - 3 / 16
const sideMidZ = (laneZMin + laneZMax) / 2
const sideLen = laneZMax - laneZMin
const frontMidX = (leftX + rightX) / 2
const frontLen = rightX - leftX + 0.5

const frontZ = baseZ - LANE_Z + 0.05
const backZ = baseZ - LANE_Z + MAP_SIZE[2] + 0.5

const TEXT_BASE_WIDTH = 500 * 4 / 36
const sideScale = sideLen / TEXT_BASE_WIDTH
const frontScale = frontLen / TEXT_BASE_WIDTH

export const spawnLaneBorder = MCFunction('sections/rhythm/lane/border_spawn', () => {
	execute.in(DIM).run(() => {
		kill(borderSelector)

		for (let i = 0; i < BORDER_STRIP_COUNT; i++) {
			const bg = argb(BORDER_ALPHAS[i], ...BORDER_DEFAULT_RGB)
			const yOff = i * BORDER_STEP - BORDER_STEP / 2

			summon('minecraft:text_display', abs(leftX, baseY + 1, sideMidZ),
				wallBorderNbt(i, bg, yOff, 90, sideScale))
			summon('minecraft:text_display', abs(leftX, baseY + 1, sideMidZ),
				wallBorderNbt(i, bg, yOff, -90, sideScale))
			summon('minecraft:text_display', abs(rightX, baseY + 1, sideMidZ),
				wallBorderNbt(i, bg, yOff, 90, sideScale))
			summon('minecraft:text_display', abs(rightX, baseY + 1, sideMidZ),
				wallBorderNbt(i, bg, yOff, -90, sideScale))

			summon('minecraft:text_display', abs(frontMidX, baseY + 1, frontZ),
				wallBorderNbt(i, bg, yOff, 0, frontScale))
			summon('minecraft:text_display', abs(frontMidX, baseY + 1, frontZ),
				wallBorderNbt(i, bg, yOff, 180, frontScale))
			summon('minecraft:text_display', abs(frontMidX, baseY + 1, backZ),
				wallBorderNbt(i, bg, yOff, 0, frontScale))
			summon('minecraft:text_display', abs(frontMidX, baseY + 1, backZ),
				wallBorderNbt(i, bg, yOff, 180, frontScale))
		}
	})
}, { runOnLoad: true })

const borderRippleCounter = Objective.create('ssb_brip', 'dummy')
const rippleStep = borderRippleCounter('$step')
const resetStep = borderRippleCounter('$rstep')
const rippleColorIdx = borderRippleCounter('$color')

const borderColorFns = GLOW_COLORS.map((color, ci) => {
	const [r, g, b] = BORDER_COLOR_MAP[color]
	return Array.from({ length: BORDER_STRIP_COUNT }, (_, si) => {
		const bg = argb(BORDER_ALPHAS[si], r, g, b)
		const sel = Selector('@e', { tag: [Tags.LANE_BORDER, borderStripTag(si)] })
		return MCFunction(`sections/rhythm/lane/border_c${ci}_s${si}`, () => {
			execute.in(DIM).as(sel).run(() => {
				data.merge.entity('@s', { background: NBT.int(bg) })
			})
		}, { lazy: true })
	})
})

const borderResetFns = Array.from({ length: BORDER_STRIP_COUNT }, (_, si) => {
	const bg = argb(BORDER_ALPHAS[si], ...BORDER_DEFAULT_RGB)
	const sel = Selector('@e', { tag: [Tags.LANE_BORDER, borderStripTag(si)] })
	return MCFunction(`sections/rhythm/lane/border_reset_s${si}`, () => {
		execute.in(DIM).as(sel).run(() => {
			data.merge.entity('@s', { background: NBT.int(bg) })
		})
	}, { lazy: true })
})

// --- Ripple animation (commented out, kept for future use) ---
// const STRIPS_PER_TICK = 2
// const RIPPLE_TICKS = Math.ceil(BORDER_STRIP_COUNT / STRIPS_PER_TICK)
//
// function buildColorChain(stripIndex: number) {
// 	let cc = _.if(rippleColorIdx.equalTo(0), () => borderColorFns[0][stripIndex]())
// 	for (let c = 1; c < GLOW_COLORS.length; c++) {
// 		const ci = c
// 		cc = cc.elseIf(rippleColorIdx.equalTo(ci), () => borderColorFns[ci][stripIndex]())
// 	}
// }
//
// const borderRippleTick = MCFunction('sections/rhythm/lane/border_ripple', () => {
// 	for (let pair = 0; pair < RIPPLE_TICKS; pair++) {
// 		const firstStrip = pair * STRIPS_PER_TICK
// 		_.if(rippleStep.equalTo(pair), () => {
// 			for (let o = 0; o < STRIPS_PER_TICK && firstStrip + o < BORDER_STRIP_COUNT; o++) {
// 				buildColorChain(firstStrip + o)
// 			}
// 		})
// 	}
// 	rippleStep.add(1)
// 	_.if(rippleStep.lessThan(RIPPLE_TICKS), () => {
// 		schedule.function(`${NAMESPACE}:sections/rhythm/lane/border_ripple`, '1t')
// 	})
// }, { lazy: true })
//
// const borderResetRippleTick = MCFunction('sections/rhythm/lane/border_reset_ripple', () => {
// 	for (let pair = 0; pair < RIPPLE_TICKS; pair++) {
// 		const firstStrip = pair * STRIPS_PER_TICK
// 		_.if(resetStep.equalTo(pair), () => {
// 			for (let o = 0; o < STRIPS_PER_TICK && firstStrip + o < BORDER_STRIP_COUNT; o++) {
// 				borderResetFns[firstStrip + o]()
// 			}
// 		})
// 	}
// 	resetStep.add(1)
// 	_.if(resetStep.lessThan(RIPPLE_TICKS), () => {
// 		schedule.function(`${NAMESPACE}:sections/rhythm/lane/border_reset_ripple`, '1t')
// 	})
// }, { lazy: true })
//
// export function triggerBorderRipple() {
// 	rippleStep.set(0)
// 	rippleColorIdx.set(glowPickScore)
// 	borderRippleTick()
// 	resetStep.set(0)
// 	schedule.function(`${NAMESPACE}:sections/rhythm/lane/border_reset_ripple`, `${RIPPLE_TICKS + 3}t`)
// }
// --- End ripple animation ---

const borderInstantColor = MCFunction('sections/rhythm/lane/border_color_set', () => {
	for (let si = 0; si < BORDER_STRIP_COUNT; si++) {
		let cc = _.if(rippleColorIdx.equalTo(0), () => borderColorFns[0][si]())
		for (let c = 1; c < GLOW_COLORS.length; c++) {
			const ci = c
			cc = cc.elseIf(rippleColorIdx.equalTo(ci), () => borderColorFns[ci][si]())
		}
	}
}, { lazy: true })

export function triggerBorderRipple() {
	rippleColorIdx.set(glowPickScore)
	borderInstantColor()
}

const doKillLane = MCFunction('sections/rhythm/lane/do_kill', () => {
	execute.in(DIM).run(() => {
		kill(laneSelector)
		kill(fragmentSelector)
	})
}, { lazy: true })

export const clearLaneBorder = MCFunction('sections/rhythm/lane/border_clear', () => {
	execute.in(DIM).run(() => {
		tp(borderSelector, abs(0, -64, 0))
	})
	schedule.function(`${NAMESPACE}:sections/rhythm/lane/border_do_kill`, '1t')
}, { lazy: true })

const doKillBorder = MCFunction('sections/rhythm/lane/border_do_kill', () => {
	execute.in(DIM).run.kill(borderSelector)
}, { lazy: true })

export const clearLaneShulkers = MCFunction('sections/rhythm/lane/clear', () => {
	execute.in(DIM).run(() => {
		tp(laneSelector, abs(0, -64, 0))
		tp(fragmentSelector, abs(0, -64, 0))
	})
	schedule.function(`${NAMESPACE}:sections/rhythm/lane/do_kill`, '1t')
}, { lazy: true })

const colorFns = GLOW_COLORS.map((color) =>
	MCFunction(`sections/rhythm/lane/glow_${color}`, () => {
		team.join(`ssb_glow_${color}`, laneSelector)
		execute.as(laneSelector).run(() => {
			effect.give('@s', 'minecraft:glowing', GLOW_DURATION, 0, true)
		})
	}, { lazy: true })
)

const PULSE_SCALE = 0.55
const REST_SCALE = 0.2

const pulseUp = MCFunction('sections/rhythm/lane/pulse_up', () => {
	execute.in(DIM).as(fragmentSelector).run(() => {
		data.merge.entity('@s', {
			transformation: {
				scale: NBT.float([PULSE_SCALE, PULSE_SCALE, PULSE_SCALE]),
				translation: NBT.float([-PULSE_SCALE / 2, -PULSE_SCALE / 2, -PULSE_SCALE / 2]),
			},
			start_interpolation: NBT.int(-1),
			interpolation_duration: NBT.int(3),
		})
	})
	schedule.function(`${NAMESPACE}:sections/rhythm/lane/pulse_down`, '4t')
}, { lazy: true })

const pulseDown = MCFunction('sections/rhythm/lane/pulse_down', () => {
	execute.in(DIM).as(fragmentSelector).run(() => {
		data.merge.entity('@s', {
			transformation: {
				scale: NBT.float([REST_SCALE, REST_SCALE, REST_SCALE]),
				translation: NBT.float([-REST_SCALE / 2, -REST_SCALE / 2, -REST_SCALE / 2]),
			},
			start_interpolation: NBT.int(-1),
			interpolation_duration: NBT.int(6),
		})
	})
}, { lazy: true })

export const beatLaneEffect = MCFunction('sections/rhythm/lane/beat', () => {
	execute.in(DIM).run(() => {
		const prevColor = glowPick('$prev')
		prevColor.set(glowPickScore)
		execute.store.result.score(glowPickScore.target, glowPickScore.objective)
			.run.random.value([0, GLOW_COLORS.length - 2], 'glow_pick')
		_.if(glowPickScore.greaterOrEqualThan(prevColor), () => {
			glowPickScore.add(1)
		})

		let chain = _.if(glowPickScore.equalTo(0), () => colorFns[0]())
		for (let i = 1; i < colorFns.length; i++) {
			const idx = i
			chain = chain.elseIf(glowPickScore.equalTo(idx), () => colorFns[idx]())
		}

		particle('minecraft:note', abs(laneCenter[0], laneCenter[1], laneCenter[2]), [2.5, 0.3, 0.3], 0, 6)
	})
	pulseUp()
	triggerBorderRipple()
}, { lazy: true })
