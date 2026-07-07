import {
	team,
	_,
	abs,
	data,
	effect,
	execute,
	kill,
	MCFunction,
	NBT,
	Objective,
	particle,
	Selector,
	summon,
	tp,
} from 'sandstone'
import type { SymbolEntity } from 'sandstone/arguments'
import { arena } from '@rhythm/config/internal/arena'
import { pattern, visuals } from '@rhythm/config'
import { Tags, boothTags, voidPark } from './state'
import { scoreSwitch } from '@rhythm/flow'

const GLOW_DURATION = 1

const glowPick = Objective.create('ssb.glow_pick', 'dummy')
const glowColorScore = glowPick('$glow')

MCFunction(
	'sections/rhythm/lane/teams_init',
	() => {
		for (const color of visuals.glowColors) {
			team.add(`ssb_glow_${color}`)
			team.modify(`ssb_glow_${color}`, 'color', color as any)
			team.modify(`ssb_glow_${color}`, 'seeFriendlyInvisibles', false)
		}
	},
	{ runOnLoad: true },
)

const laneSelector = Selector('@e', { tag: Tags.LANE })
const fragmentSelector = Selector('@e', { tag: Tags.LANE_FRAGMENT })
const borderSelector = Selector('@e', { tag: Tags.LANE_BORDER })

const baseY = arena.laneFloorY
const lane = arena.lane
const laneCenter = lane.pos(Math.floor(pattern.width / 2), baseY + 1.5, 0)

const FRAGMENT_BLOCKS = [
	'minecraft:white_stained_glass',
	'minecraft:light_blue_stained_glass',
	'minecraft:magenta_stained_glass',
	'minecraft:cyan_stained_glass',
	'minecraft:purple_stained_glass',
	'minecraft:pink_stained_glass',
] as const

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

export const spawnLaneShulkers = MCFunction(
	'sections/rhythm/lane/spawn',
	() => {
		kill(laneSelector)
		kill(fragmentSelector)
		for (let i = 0; i < pattern.width; i++) {
			const pos = lane.pos(i, 0, 0)
			summon('minecraft:happy_ghast', abs(pos[0], baseY - 1 / 160, pos[2]), {
				Tags: boothTags(Tags.LANE),
				NoAI: true,
				NoGravity: true,
				Invulnerable: true,
				Silent: true,
				attributes: [{ id: 'minecraft:scale', base: 0.25 }],
				active_effects: [{ id: 'minecraft:invisibility', duration: NBT.int(-1), show_particles: false }],
			})
		}

		for (let i = 0; i < FRAGMENTS.length; i++) {
			const frag = FRAGMENTS[i]
			const block = FRAGMENT_BLOCKS[i % FRAGMENT_BLOCKS.length]
			const [sx, sy, sz] = frag.scale
			const fragPos = lane.pos(frag.pos[0], baseY + frag.pos[1], frag.pos[2])
			summon('minecraft:block_display', abs(fragPos[0], fragPos[1], fragPos[2]), {
				Tags: boothTags(Tags.LANE_FRAGMENT),
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
	},
	{ lazy: true },
)

function argb(a: number, r: number, g: number, b: number) {
	return ((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff) | 0
}

const TD_PX_PER_BLOCK = 36
const TD_SPACE_PX = 4
const TD_BG_PAD_PX = 0.5

const BORDER_CHARS = 8
const BORDER_BG_WIDTH = (BORDER_CHARS * TD_SPACE_PX + 2 * TD_BG_PAD_PX) / TD_PX_PER_BLOCK
const fitWidthScale = (length: number) => length / BORDER_BG_WIDTH

const BORDER_SCALE_Y = visuals.border.height / (visuals.border.stripCount * 0.25)
const BORDER_STEP = visuals.border.height / visuals.border.stripCount

const BORDER_ALPHAS = Array.from({ length: visuals.border.stripCount }, (_, i) =>
	i === visuals.border.stripCount - 1 ? 5 : Math.round(180 * (1 - i / (visuals.border.stripCount - 1)) ** 2.5),
)

const BORDER_COLOR_MAP: Record<string, [number, number, number]> = {
	aqua: [85, 255, 255],
	blue: [85, 85, 255],
	green: [85, 255, 85],
	yellow: [255, 255, 85],
	light_purple: [255, 85, 255],
	red: [255, 85, 85],
	gold: [255, 170, 0],
	white: [255, 255, 255],
}

function borderStripTag(i: number) {
	return `ssb.lane.border.${i}`
}

const BORDER_TEXT = ' '.repeat(BORDER_CHARS)

function wallBorderNbt(
	stripIndex: number,
	bg: number,
	yOff: number,
	facing: number,
	scaleX: number,
): SymbolEntity['text_display'] {
	return {
		Tags: boothTags(Tags.LANE_BORDER, borderStripTag(stripIndex)),
		text: BORDER_TEXT,
		alignment: 'center' as const,
		line_width: NBT.int(9999),
		text_opacity: NBT.byte(0),
		background: NBT.int(bg),
		shadow: false,
		see_through: false,
		billboard: 'fixed' as const,
		// view_range: NBT.float(10 / 64),
		Rotation: NBT.float([facing, 0]),
		transformation: {
			left_rotation: NBT.float([0, 0, 0, 1]),
			right_rotation: NBT.float([0, 0, 0, 1]),
			translation: NBT.float([0, yOff, 0]),
			scale: NBT.float([scaleX, BORDER_SCALE_Y, 1]),
		},
	}
}

const leftW = lane.widthMin
const rightW = lane.widthMax
const sideMidD = (lane.depthMin + lane.depthMax) / 2
const sideLen = lane.depthMax - lane.depthMin
const frontMidW = (leftW + rightW) / 2
const frontLen = rightW - leftW

const frontD = lane.frontDepth
const backD = lane.backDepth

const sideScale = fitWidthScale(sideLen) * visuals.border.lengthScale.sides
const frontScale = fitWidthScale(frontLen) * visuals.border.lengthScale.frontBack

const dodgeInt = (c: number): number => (Number.isInteger(c) ? c + 0.001 : c)
const applyOffset = (p: [number, number, number], o: [number, number, number]): [number, number, number] => [
	dodgeInt(p[0] + o[0]),
	p[1] + o[1],
	dodgeInt(p[2] + o[2]),
]

const sideOffA = visuals.border.offset.sides.a
const sideOffB = visuals.border.offset.sides.b
const fbOffA = visuals.border.offset.frontBack.a
const fbOffB = visuals.border.offset.frontBack.b

export const spawnLaneBorder = MCFunction(
	'sections/rhythm/lane/border_spawn',
	() => {
		kill(borderSelector)

		for (let i = 0; i < visuals.border.stripCount; i++) {
			const bg = argb(BORDER_ALPHAS[i], ...visuals.border.defaultColor)
			const yOff = i * BORDER_STEP - BORDER_STEP / 2

			const sLeftBase = lane.pos(leftW, baseY + 1, sideMidD)
			const sRightBase = lane.pos(rightW, baseY + 1, sideMidD)
			const fFrontBase = lane.pos(frontMidW, baseY + 1, frontD)
			const fBackBase = lane.pos(frontMidW, baseY + 1, backD)

			summon(
				'minecraft:text_display',
				abs(...applyOffset(sLeftBase, sideOffA)),
				wallBorderNbt(i, bg, yOff, lane.sideFacing, sideScale),
			)
			summon(
				'minecraft:text_display',
				abs(...applyOffset(sLeftBase, sideOffB)),
				wallBorderNbt(i, bg, yOff, lane.sideFacing + 180, sideScale),
			)
			summon(
				'minecraft:text_display',
				abs(...applyOffset(sRightBase, sideOffA)),
				wallBorderNbt(i, bg, yOff, lane.sideFacing, sideScale),
			)
			summon(
				'minecraft:text_display',
				abs(...applyOffset(sRightBase, sideOffB)),
				wallBorderNbt(i, bg, yOff, lane.sideFacing + 180, sideScale),
			)

			summon(
				'minecraft:text_display',
				abs(...applyOffset(fFrontBase, fbOffA)),
				wallBorderNbt(i, bg, yOff, lane.frontFacing, frontScale),
			)
			summon(
				'minecraft:text_display',
				abs(...applyOffset(fFrontBase, fbOffB)),
				wallBorderNbt(i, bg, yOff, lane.frontFacing + 180, frontScale),
			)
			summon(
				'minecraft:text_display',
				abs(...applyOffset(fBackBase, fbOffA)),
				wallBorderNbt(i, bg, yOff, lane.frontFacing, frontScale),
			)
			summon(
				'minecraft:text_display',
				abs(...applyOffset(fBackBase, fbOffB)),
				wallBorderNbt(i, bg, yOff, lane.frontFacing + 180, frontScale),
			)
		}
	},
	{ runOnLoad: true },
)

const borderRippleCounter = Objective.create('ssb.border_ripple', 'dummy')
const borderColorIndex = borderRippleCounter('$color')

const borderColorFns = visuals.glowColors.map((color, ci) => {
	const [r, g, b] = BORDER_COLOR_MAP[color]
	return MCFunction(
		`sections/rhythm/lane/border_c${ci}`,
		() => {
			for (let si = 0; si < visuals.border.stripCount; si++) {
				const bg = argb(BORDER_ALPHAS[si], r, g, b)
				const sel = Selector('@e', { tag: [Tags.LANE_BORDER, borderStripTag(si)] })
				execute.as(sel).run.data.merge.entity('@s', { background: NBT.int(bg) })
			}
		},
		{ lazy: true },
	)
})

const borderInstantColor = MCFunction(
	'sections/rhythm/lane/border_color_set',
	() => {
		scoreSwitch(
			borderColorIndex,
			visuals.glowColors.map((_color, ci) => [ci, () => borderColorFns[ci]()]),
		)
	},
	{ lazy: true },
)

function triggerBorderRipple() {
	borderColorIndex.set(glowColorScore)
	borderInstantColor()
}

const doKillLane = MCFunction(
	'sections/rhythm/lane/do_kill',
	() => {
		kill(laneSelector)
		kill(fragmentSelector)
	},
	{ lazy: true },
)

export const clearLaneShulkers = MCFunction(
	'sections/rhythm/lane/clear',
	() => {
		// park out of sight for a tick so the kill isn't visible
		tp(laneSelector, abs(...voidPark))
		tp(fragmentSelector, abs(...voidPark))

		doKillLane.schedule.function('1t', 'replace')
	},
	{ lazy: true },
)

const colorFns = visuals.glowColors.map((color) =>
	MCFunction(
		`sections/rhythm/lane/glow_${color}`,
		() => {
			team.join(`ssb_glow_${color}`, laneSelector)
			execute.as(laneSelector).run(() => {
				effect.give('@s', 'minecraft:glowing', GLOW_DURATION, 0, true)
			})
		},
		{ lazy: true },
	),
)

const pulseDown = MCFunction(
	'sections/rhythm/lane/pulse_down',
	() => {
		execute.as(fragmentSelector).run(() => {
			data.merge.entity('@s', {
				transformation: {
					scale: NBT.float([visuals.pulse.restScale, visuals.pulse.restScale, visuals.pulse.restScale]),
					translation: NBT.float([
						-visuals.pulse.restScale / 2,
						-visuals.pulse.restScale / 2,
						-visuals.pulse.restScale / 2,
					]),
				},
				start_interpolation: NBT.int(-1),
				interpolation_duration: NBT.int(6),
			})
		})
	},
	{ lazy: true },
)

const pulseUp = MCFunction(
	'sections/rhythm/lane/pulse_up',
	() => {
		execute.as(fragmentSelector).run(() => {
			data.merge.entity('@s', {
				transformation: {
					scale: NBT.float([visuals.pulse.activeScale, visuals.pulse.activeScale, visuals.pulse.activeScale]),
					translation: NBT.float([
						-visuals.pulse.activeScale / 2,
						-visuals.pulse.activeScale / 2,
						-visuals.pulse.activeScale / 2,
					]),
				},
				start_interpolation: NBT.int(-1),
				interpolation_duration: NBT.int(3),
			})
		})
		pulseDown.schedule.function('4t', 'replace')
	},
	{ lazy: true },
)

export const beatLaneEffect = MCFunction(
	'sections/rhythm/lane/beat',
	() => {
		const prevColor = glowPick('$prev')
		prevColor.set(glowColorScore)
		execute.store.result.score(glowColorScore).run.random.value([0, visuals.glowColors.length - 2], 'glow_pick')
		_.if(glowColorScore.greaterThanOrEqualTo(prevColor), () => {
			glowColorScore.add(1)
		})

		scoreSwitch(
			glowColorScore,
			colorFns.map((fn, ci) => [ci, () => fn()]),
		)

		particle('minecraft:note', abs(laneCenter[0], laneCenter[1], laneCenter[2]), arena.particleSpread, 0, 6)

		pulseUp()
		triggerBorderRipple()
	},
	{ lazy: true },
)
