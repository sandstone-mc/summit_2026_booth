// Parse CSS-like length values for the MC coordinate system (1 block = 1 m).
//
// Units:
//   px            →  1/16 of a block (= 1/16 m). Default unit if omitted.
//   vh            →  1/100 of the scene's height.
//   vw            →  1/100 of the scene's width.
//   %             →  1/100 of the supplied axis dimension (caller picks which).
//   fit-content   →  length of the element's content (resolved by caller;
//                   returned with meters=0 as a marker).
//
// `axisSize` is the relevant dimension in meters — pass `bounds[0]` for
// width-axis values, `bounds[1]` for height-axis values.
//
// Returns both px (raw user value) and meters (MC coord). px is preserved
// for things like text_display's `line_width`, which is in pixels.

import { fontMetrics } from './text-metrics'
import { DEFAULT_FONT_ID } from './text-metrics/font-loader'

export type Unit = 'px' | 'vh' | 'vw' | '%' | 'fit-content'

export type Length = { value: number; unit: Unit; px: number; meters: number }

export function parseLength(raw: string, axisSize: number): Length | undefined {
	if (typeof raw !== 'string') return undefined
	const trimmed = raw.trim()
	if (trimmed === 'fit-content') {
		// Caller resolves actual size based on element content.
		return { value: 0, unit: 'fit-content', px: 0, meters: 0 }
	}
	const m = trimmed.match(/^(-?\d*\.?\d+)\s*(px|vh|vw|%)?$/i)
	if (!m) return undefined
	const num = parseFloat(m[1])
	const unit = (m[2]?.toLowerCase() ?? 'px') as Unit
	let meters: number
	switch (unit) {
		case 'px':
			meters = num / 16
			break
		case 'vh':
		case 'vw':
		case '%':
			meters = (num / 100) * axisSize
			break
		default:
			return undefined
	}
	// `px` is the equivalent pixel value (1 m = 16 px). Use this for
	// pixel-based MC fields like text_display's line_width.
	return { value: num, unit, px: meters * 16, meters }
}

// `font-size: N px` → text is N actual in-game pixels tall (= N/16 blocks).
// text_display's default NBT `height` is 0.25 blocks. With default settings,
// visible quad height = scale * 0.25 blocks. So scale = (N/16) / 0.25 = N/4.
export function pxToTextScale(px: number): number {
	return px / 4
}

// Line spacing in blocks for single-line text of given font-size px.
//
// Derived from font metrics — no magic numbers. Line spacing in bitmap
// pixels = cellHeight + measuredDescenderPx (worst-case descent depth),
// matching animated-java's `cursor.y -= 10` hardcode for default font
// (cellHeight=8, measuredDescenderPx=2 → 10 px line spacing).
//
// At entity scale `pxToTextScale(N) = N/4`, 1 bitmap px renders as
// `(N/4) × 0.25 / 8 = N/128` blocks (8 px cellHeight = 0.25 blocks
// at scale=1 per the comment above). So:
//
//   pxToTextLineHeight(px, fontId)
//     = (cellHeight + measuredDescenderPx) × pxToTextScale(px) / 32
//     = (cellHeight + measuredDescenderPx) × px / 128
//
// `fontMetrics()` throws pre-load; callers run after `loadFontMetrics()`.
export function pxToTextLineHeight(px: number, fontId: string = DEFAULT_FONT_ID): number {
	const m = fontMetrics(fontId)
	// MC text_display renders each line in a fixed-height quad (`scale * 0.25`
	// blocks). The character + its descender both fit inside that quad, so
	// per-line spacing == cellHeight alone — adding `measuredDescenderPx`
	// reserves space MC never uses and shifts multi-line text downward.
	const lineSpacingPx = m.cellHeight
	return (lineSpacingPx * pxToTextScale(px)) / 32
}