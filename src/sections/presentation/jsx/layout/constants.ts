// Layout-wide magic numbers + defaults shared across the layout module.

import { pxToTextScale } from '../length'
import { fontMetrics } from '../text-metrics'

// text_display's visible face sits ~0.5 blocks in front of the entity's
// NBT z. Push the NBT z back so the visual offset becomes 1/64 blocks.
export const Z_VISUAL_OFFSET = 0.015625

// Default scale (in font-pixel units) for each text element when LESS
// doesn't specify `font-size`. Values sized for typical slide legibility.
export function defaultFontPx(type: string): number {
	switch (type) {
		case 'h1': return 32
		case 'h2': return 24
		case 'code': return 8
		default: return 16 // p and unknown
	}
}

// `<img>` fallback when neither `height`/`width` props nor LESS rules
// specify a height. 30vh on scene height matches the typical screenshot.
export const DEFAULT_IMG_HEIGHT = '30vh'

// `<code>` border + language-tag default colors. Picked up when the
// caller didn't set their own, so even unset `<code>` blocks read as
// code boxes instead of collapsing into the code color.
export const DEFAULT_CODE_BORDER_COLOR = '#6a6a6a' as const
export const DEFAULT_CODE_LANG_COLOR = '#4ec9b0' as const

// Repository of grammars available to `<code lang="…">` blocks.
// `scripts/fetch-syntax-parsers.ts` populates the wasm + .scm files.
import type { Grammar } from '../highlight/highlighter'

export const GRAMMARS: Record<string, Grammar> = {
	mcfunction: {
		wasmPath: 'resources/jsx/parser/tree-sitter-mcfunction.wasm',
		queryPath: 'resources/jsx/parser/mcfunction.highlights.scm',
	},
	typescript: {
		wasmPath: 'resources/jsx/parser/tree-sitter-typescript.wasm',
		queryPath: 'resources/jsx/parser/typescript.highlights.scm',
	},
}

export const TEXT_RENDER_OFFSET = 0.1875

export function parityOffset(sceneH: number): number {
	return sceneH % 2 === 0 ? 0 : 0.5
}

// Vertical gap (in world blocks) reserved at the bottom of a text
// element's cell to make room for descender-bearing characters (g, p,
// q, y, etc.) so they don't visually bleed into the next cell.
//
// Used in two places:
//   - `blockGap(prev, next, sceneH)` adds this between a text element
//     and a following non-text element.
//   - `finalizeScrollCodeLayout(el)` subtracts this from the scroll
//     block's cellH before splitting into viewport chunks, so the
//     bottom border isn't clipped.
//
// `fontMetrics(fontId)` throws pre-load; callers run after
// `loadFontMetrics()` so the per-call resolution is safe.
export function getTextDescender(fontId: string, scalePx: number): number {
	const m = fontMetrics(fontId)
	const descenderPx = m.measuredDescenderPx
	// Convert worst-case descender depth from bitmap pixels to MC blocks
	// at the element's rendering scale. 1 bitmap pixel = `pxToTextScale`
	// × `1/40` blocks (validated against animated-java's preview math:
	// `geo.scale(0.4)` × `pos.multiplyScalar(1/16)` = `0.025` blocks/px
	// at MC scale=1, scaled by `pxToTextScale(scalePx)` for our scale).
	const blocks = (descenderPx * pxToTextScale(scalePx)) / 40

	return blocks
}