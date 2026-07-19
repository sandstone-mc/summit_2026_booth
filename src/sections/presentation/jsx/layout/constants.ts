// Layout-wide magic numbers + defaults.

import { pxToTextScale } from '../length'
import { fontMetrics } from '../text-metrics'

// NBT z offset so the visible face sits 1/64 blocks in front of the
// entity's NBT z (MC text_display's geometry origin is offset).
export const Z_VISUAL_OFFSET = 0.015625

// Fixed offset between MC text_display entity Y and visible glyph
// bottom — without it, topmost text on a tightly-stacked slide
// renders that many blocks above the slide's top edge.
export const TEXT_RENDER_OFFSET = 0.1875

export function parityOffset(sceneH: number): number {
	return sceneH % 2 === 0 ? 0 : 0.25
}

// Descender slack (in MC blocks) reserved at the bottom of a text
// element's cell for descender-bearing characters.
export function getTextDescender(fontId: string, scalePx: number): number {
	const m = fontMetrics(fontId)
	const descenderPx = m.measuredDescenderPx
	const blocks = (descenderPx * pxToTextScale(scalePx)) / 40
	return blocks
}