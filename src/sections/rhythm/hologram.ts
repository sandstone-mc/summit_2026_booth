import { abs, data, NBT, summon } from 'sandstone'
import { type JSONTextComponent } from 'sandstone/arguments'
import { type Tags, boothTags } from './game/state'
import { type PanelConfig } from './config'
import { panels } from './config/internal/derived'

const BASE_LINE_HEIGHT = 0.25

export function scrollFrame(name: string, offset: number): string {
	const padded = name + '   ' + name
	const start = offset % (name.length + 3)
	return padded.substring(start, start + panels.maxNameLength)
}

export function scrollFrameCount(name: string): number {
	return name.length + 3
}

export function needsScroll(name: string): boolean {
	return name.length > panels.maxNameLength
}

export function clampName(name: string): string {
	if (name.length <= panels.maxNameLength) {
		const total = panels.maxNameLength - name.length
		const left = Math.floor(total / 2)
		const right = total - left
		return ' '.repeat(left) + name + ' '.repeat(right)
	}
	return name.substring(0, panels.maxNameLength - 1) + '…'
}

function lineHeight(panel: PanelConfig) {
	return BASE_LINE_HEIGHT * panel.scale
}

export function lineY(panel: PanelConfig, totalLines: number, lineIdx: number) {
	return panel.y + (totalLines - 1 - lineIdx) * lineHeight(panel) + lineHeight(panel) / 2
}

export function mergeDisplayText(target: Parameters<typeof data.merge.entity>[0], text: JSONTextComponent) {
	data.merge.entity(target, { text } as unknown as Parameters<typeof data.merge.entity>[1])
}

function panelNbt(panel: PanelConfig, tags: Tags[], text: JSONTextComponent, bg: number): Record<string, any> {
	const nbt: Record<string, any> = {
		Tags: boothTags(...tags),
		text,
		billboard: 'fixed' as const,
		Rotation: NBT.float([panel.facing, 0]),
		shadow: true,
		background: NBT.int(bg),
		line_width: NBT.int(400),
		view_range: NBT.float(1.0),
		text_opacity: NBT.byte(-1),
		see_through: false,
	}

	if (panel.scale !== 1) {
		nbt.transformation = {
			left_rotation: NBT.float([0, 0, 0, 1]),
			right_rotation: NBT.float([0, 0, 0, 1]),
			translation: NBT.float([0, 0, 0]),
			scale: NBT.float([panel.scale, panel.scale, panel.scale]),
		}
	}

	return nbt
}

export function spawnPanel(panel: PanelConfig, tags: Tags[], text: JSONTextComponent, bg = panels.background) {
	summon('minecraft:text_display', abs(panel.x, panel.y, panel.z), panelNbt(panel, tags, text, bg))
}

// a block of `lines` panel lines starting at `lineIdx`; transparent background, so it shares the backdrop's plane
export function spawnPanelLines(panel: PanelConfig, tags: Tags[], totalLines: number, lineIdx: number, lines = 1) {
	const y = panel.y + (totalLines - lineIdx - lines) * lineHeight(panel)
	summon('minecraft:text_display', abs(panel.x, y, panel.z), panelNbt(panel, tags, ' ', 0))
}

const CLICK_FRONT_MARGIN = 0.1

export function spawnClick(
	panel: PanelConfig,
	xOffset: number,
	y: number,
	tags: Tags[],
	width: number,
	yOffset = 0,
	height?: number,
) {
	const clickHeight = height ?? lineHeight(panel)
	const rad = (panel.facing * Math.PI) / 180
	/*
	 * interaction hitboxes are square columns (width applies to depth too), so sink the box
	 * behind the panel plane: only a thin front slice extends past the text, and angled
	 * clicks can't land on a neighboring button's protruding box
	 */
	const forward = width / 2 - CLICK_FRONT_MARGIN
	const interactionX = Math.round((panel.x + Math.cos(rad) * xOffset + Math.sin(rad) * forward) * 1000) / 1000
	const interactionZ = Math.round((panel.z + Math.sin(rad) * xOffset - Math.cos(rad) * forward) * 1000) / 1000

	summon('minecraft:interaction', abs(interactionX, y - clickHeight / 2 + yOffset, interactionZ), {
		Tags: boothTags(...tags),
		width: NBT.float(width),
		height: NBT.float(clickHeight),
		response: true,
	})
}
