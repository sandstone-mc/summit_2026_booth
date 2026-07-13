// Layout-wide magic numbers + defaults shared across the layout module.

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

// Vertical gap (in world blocks) reserved for a text element's descender
// tail in two contexts:
//   - `blockGap(prev, next, sceneH)` adds this between a text element and
//     a following non-text element.
//   - `finalizeScrollCodeLayout(el)` subtracts this from the scroll
//     block's cellH before splitting into viewport chunks, so the bottom
//     border isn't clipped.
let _TEXT_DESCENDER: number | null = null

// TODO: This is currently useless, we still need to accurately calculate this, nothing is doing it yet
export function getTextDescender(): number {
	if (_TEXT_DESCENDER === null) {
		_TEXT_DESCENDER = 0
	}
	return _TEXT_DESCENDER
}