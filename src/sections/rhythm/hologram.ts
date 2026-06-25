import { abs, NBT, summon } from 'sandstone'
import type { PanelConfig } from './config/panels'
import { MAX_NAME_LEN } from './config/panels'

const BASE_LINE_HEIGHT = 0.25

export function scrollFrame(name: string, offset: number): string {
	const padded = name + '   ' + name
	const start = offset % (name.length + 3)
	return padded.substring(start, start + MAX_NAME_LEN)
}

export function scrollFrameCount(name: string): number {
	return name.length + 3
}

export function needsScroll(name: string): boolean {
	return name.length > MAX_NAME_LEN
}

export function clampName(name: string): string {
	if (name.length <= MAX_NAME_LEN) {
		const total = MAX_NAME_LEN - name.length
		const left = Math.floor(total / 2)
		const right = total - left
		return ' '.repeat(left) + name + ' '.repeat(right)
	}
	return name.substring(0, MAX_NAME_LEN - 1) + '…'
}

export function lineHeight(panel: PanelConfig) {
	return BASE_LINE_HEIGHT * panel.scale
}

export function lineY(panel: PanelConfig, totalLines: number, lineIdx: number) {
	const lh = lineHeight(panel)
	return panel.y + (totalLines - 1 - lineIdx) * lh + lh / 2
}

export function spawnPanel(panel: PanelConfig, tags: string[], text: any, bg = 0x54000000) {
	const nbt: Record<string, any> = {
		Tags: tags,
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

	summon('minecraft:text_display', abs(panel.x, panel.y, panel.z), nbt)
}

export function spawnClick(
	panel: PanelConfig, xOffset: number, y: number,
	tags: string[], width: number, height?: number,
) {
	const h = height ?? lineHeight(panel)
	const rad = panel.facing * Math.PI / 180
	const ix = Math.round((panel.x + xOffset + Math.sin(rad) * 0.45) * 1000) / 1000
	const iz = Math.round((panel.z - Math.cos(rad) * 0.45) * 1000) / 1000

	summon('minecraft:interaction', abs(ix, y - h / 2, iz), {
		Tags: tags,
		width: NBT.float(width),
		height: NBT.float(h),
		response: true,
	})
}
