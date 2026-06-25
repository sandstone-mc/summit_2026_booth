import { _, abs, data, effect, execute, kill, MCFunction, NBT, Objective, particle, raw, schedule, Selector, summon, team, tp } from 'sandstone'
import { arena } from '@rhythm/config/internal/arena'
import { pattern, walls, map, visuals, wallMovement } from '@rhythm/config'
import { Tags } from './state'
import { DIMENSION, NAMESPACE } from '@shared'

const GLOW_DURATION = 1

const glowPick = Objective.create('ssb.glow_pick', 'dummy')
const glowColorScore = glowPick('$glow')

MCFunction('sections/rhythm/lane/teams_init', () => {
	for (const color of visuals.glowColors) {
		team.add(`ssb_glow_${color}`)
		team.modify(`ssb_glow_${color}`, 'color', color as any)
		team.modify(`ssb_glow_${color}`, 'seeFriendlyInvisibles', false)
	}
}, { runOnLoad: true })

const laneSelector = Selector('@e', { tag: Tags.LANE })
const fragmentSelector = Selector('@e', { tag: Tags.LANE_FRAGMENT })
const borderSelector = Selector('@e', { tag: Tags.LANE_BORDER })

const [baseX, baseY] = [arena.playAreaMin[0], arena.playAreaMin[1]]
const baseZ = arena.goldLine[2]
const laneCenter = [baseX + Math.floor(pattern.width / 2), baseY + 1.5, baseZ] as const

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
	execute.in(DIMENSION).run(() => {
		kill(laneSelector)
		kill(fragmentSelector)
		for (let x = 0; x < pattern.width; x++) {
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

const LANE_Z_MID = -walls.passDistance + wallMovement.totalDistance / 2

function argb(a: number, r: number, g: number, b: number) {
	return ((a & 0xFF) << 24 | (r & 0xFF) << 16 | (g & 0xFF) << 8 | (b & 0xFF)) | 0
}

const BORDER_SCALE_Y = visuals.border.height / (visuals.border.stripCount * 0.25)
const BORDER_STEP = visuals.border.height / visuals.border.stripCount

const BORDER_ALPHAS = Array.from({ length: visuals.border.stripCount }, (_, i) =>
	i === visuals.border.stripCount - 1 ? 5 : Math.round(180 * (1 - i / (visuals.border.stripCount - 1)) ** 2.5)
)

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
const laneXMax = baseX + map.laneWidth
const laneZMin = baseZ - map.laneOffset.z - 2
const laneZMax = baseZ - map.laneOffset.z + map.size[2] + 2

// Text display rendering offset compensation
const TEXT_DISPLAY_OFFSET = 0.175 - 3 / 16
const leftX = laneXMin + TEXT_DISPLAY_OFFSET
const rightX = laneXMax + TEXT_DISPLAY_OFFSET
const sideMidZ = (laneZMin + laneZMax) / 2
const sideLen = laneZMax - laneZMin
const frontMidX = (leftX + rightX) / 2
const frontLen = rightX - leftX + 0.5

const frontZ = baseZ - map.laneOffset.z + 0.05
const backZ = baseZ - map.laneOffset.z + map.size[2] + 0.5

const TEXT_BASE_WIDTH = 500 * 4 / 36
const sideScale = sideLen / TEXT_BASE_WIDTH
const frontScale = frontLen / TEXT_BASE_WIDTH

export const spawnLaneBorder = MCFunction('sections/rhythm/lane/border_spawn', () => {
	execute.in(DIMENSION).run(() => {
		kill(borderSelector)

		for (let i = 0; i < visuals.border.stripCount; i++) {
			const bg = argb(BORDER_ALPHAS[i], ...visuals.border.defaultColor)
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

const borderRippleCounter = Objective.create('ssb.border_ripple', 'dummy')
const rippleStep = borderRippleCounter('$step')
const resetStep = borderRippleCounter('$rstep')
const borderColorIndex = borderRippleCounter('$color')

const borderColorFns = visuals.glowColors.map((color, ci) => {
	const [r, g, b] = BORDER_COLOR_MAP[color]
	return Array.from({ length: visuals.border.stripCount }, (_, si) => {
		const bg = argb(BORDER_ALPHAS[si], r, g, b)
		const sel = Selector('@e', { tag: [Tags.LANE_BORDER, borderStripTag(si)] })
		return MCFunction(`sections/rhythm/lane/border_c${ci}_s${si}`, () => {
			execute.in(DIMENSION).as(sel).run(() => {
				data.merge.entity('@s', { background: NBT.int(bg) })
			})
		}, { lazy: true })
	})
})

const borderResetFns = Array.from({ length: visuals.border.stripCount }, (_, si) => {
	const bg = argb(BORDER_ALPHAS[si], ...visuals.border.defaultColor)
	const sel = Selector('@e', { tag: [Tags.LANE_BORDER, borderStripTag(si)] })
	return MCFunction(`sections/rhythm/lane/border_reset_s${si}`, () => {
		execute.in(DIMENSION).as(sel).run(() => {
			data.merge.entity('@s', { background: NBT.int(bg) })
		})
	}, { lazy: true })
})

const borderInstantColor = MCFunction('sections/rhythm/lane/border_color_set', () => {
	for (let si = 0; si < visuals.border.stripCount; si++) {
		let cc = _.if(borderColorIndex.equalTo(0), () => borderColorFns[0][si]())
		for (let c = 1; c < visuals.glowColors.length; c++) {
			const ci = c
			cc = cc.elseIf(borderColorIndex.equalTo(ci), () => borderColorFns[ci][si]())
		}
	}
}, { lazy: true })

export function triggerBorderRipple() {
	borderColorIndex.set(glowColorScore)
	borderInstantColor()
}

const doKillLane = MCFunction('sections/rhythm/lane/do_kill', () => {
	execute.in(DIMENSION).run(() => {
		kill(laneSelector)
		kill(fragmentSelector)
	})
}, { lazy: true })

export const clearLaneBorder = MCFunction('sections/rhythm/lane/border_clear', () => {
	execute.in(DIMENSION).run(() => {
		tp(borderSelector, abs(0, -64, 0))
	})
	schedule.function(`${NAMESPACE}:sections/rhythm/lane/border_do_kill`, '1t')
}, { lazy: true })

const doKillBorder = MCFunction('sections/rhythm/lane/border_do_kill', () => {
	execute.in(DIMENSION).run.kill(borderSelector)
}, { lazy: true })

export const clearLaneShulkers = MCFunction('sections/rhythm/lane/clear', () => {
	execute.in(DIMENSION).run(() => {
		tp(laneSelector, abs(0, -64, 0))
		tp(fragmentSelector, abs(0, -64, 0))
	})
	schedule.function(`${NAMESPACE}:sections/rhythm/lane/do_kill`, '1t')
}, { lazy: true })

const colorFns = visuals.glowColors.map((color) =>
	MCFunction(`sections/rhythm/lane/glow_${color}`, () => {
		team.join(`ssb_glow_${color}`, laneSelector)
		execute.as(laneSelector).run(() => {
			effect.give('@s', 'minecraft:glowing', GLOW_DURATION, 0, true)
		})
	}, { lazy: true })
)

const pulseUp = MCFunction('sections/rhythm/lane/pulse_up', () => {
	execute.in(DIMENSION).as(fragmentSelector).run(() => {
		data.merge.entity('@s', {
			transformation: {
				scale: NBT.float([visuals.pulse.activeScale, visuals.pulse.activeScale, visuals.pulse.activeScale]),
				translation: NBT.float([-visuals.pulse.activeScale / 2, -visuals.pulse.activeScale / 2, -visuals.pulse.activeScale / 2]),
			},
			start_interpolation: NBT.int(-1),
			interpolation_duration: NBT.int(3),
		})
	})
	schedule.function(`${NAMESPACE}:sections/rhythm/lane/pulse_down`, '4t')
}, { lazy: true })

const pulseDown = MCFunction('sections/rhythm/lane/pulse_down', () => {
	execute.in(DIMENSION).as(fragmentSelector).run(() => {
		data.merge.entity('@s', {
			transformation: {
				scale: NBT.float([visuals.pulse.restScale, visuals.pulse.restScale, visuals.pulse.restScale]),
				translation: NBT.float([-visuals.pulse.restScale / 2, -visuals.pulse.restScale / 2, -visuals.pulse.restScale / 2]),
			},
			start_interpolation: NBT.int(-1),
			interpolation_duration: NBT.int(6),
		})
	})
}, { lazy: true })

export const beatLaneEffect = MCFunction('sections/rhythm/lane/beat', () => {
	execute.in(DIMENSION).run(() => {
		const prevColor = glowPick('$prev')
		prevColor.set(glowColorScore)
		execute.store.result.score(glowColorScore.target, glowColorScore.objective)
			.run.random.value([0, visuals.glowColors.length - 2], 'glow_pick')
		_.if(glowColorScore.greaterOrEqualThan(prevColor), () => {
			glowColorScore.add(1)
		})

		let chain = _.if(glowColorScore.equalTo(0), () => colorFns[0]())
		for (let i = 1; i < colorFns.length; i++) {
			const idx = i
			chain = chain.elseIf(glowColorScore.equalTo(idx), () => colorFns[idx]())
		}

		particle('minecraft:note', abs(laneCenter[0], laneCenter[1], laneCenter[2]), [2.5, 0.3, 0.3], 0, 6)
	})
	pulseUp()
	triggerBorderRipple()
}, { lazy: true })
