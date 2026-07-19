// Internal helpers for the autocomplete component — bordered
// editor padding, popup row building, and min-line-width fallback.

import type { StyledSegment, VNode } from '../../render'
import type { CssDeclarations } from '../../less/types'
import { CodeBorders } from '../code/code-borders'

const codeBorders = new CodeBorders()

// Build a bordered text_display representation of the editor's
// current `slice`, padded out to `maxLines` visual rows with empty
// placeholder rows. Used by `<autocomplete>` so the editor's visible
// area stays a fixed `maxLines` rows tall as typing progresses.
export function buildPaddedCodeBordered(
	slice: string,
	lang: string,
	fontId: string,
	fullWrapWidthPx: number,
	lineNumbers: boolean,
	sourceLineCount: number,
	declarations: CssDeclarations,
	sidePadding: [number, number],
	maxLines: number,
): StyledSegment[] {
	const borderColor = declarations['border-color'] as `#${string}` | undefined
	const langColor = declarations['lang-color'] as `#${string}` | undefined
	const codeColor = declarations.color as `#${string}` | undefined
	const gutterColor = declarations['gutter-color'] as `#${string}` | undefined
	const rows = codeBorders.buildRows({
		content: slice,
		language: lang,
		fontId,
		lineWidthPx: fullWrapWidthPx,
		bold: false,
		borderColor,
		langColor,
		codeColor,
		precomputed: undefined,
		lineNumbers,
		lineCount: sourceLineCount,
		gutterColor,
		sidePadding,
	})
	const numEmptyRows = Math.max(0, maxLines - rows.codeRows.length)
	const gutterChars = rows.gutterChars
	const longestInnerChars = rows.longestInnerChars
	const emptyRowText =
		'│ ' + ' '.repeat(gutterChars) + ' │ ' + ' '.repeat(longestInnerChars) + ' │'
	const out: StyledSegment[] = []
	for (const seg of rows.topBorder) out.push({ ...seg })
	for (const row of rows.codeRows) for (const seg of row) out.push({ ...seg })
	for (let i = 0; i < numEmptyRows; i++) {
		out.push({ text: '\n', color: borderColor })
		out.push({ text: emptyRowText, color: borderColor })
	}
	if (rows.bottomBorder.length > 0) {
		out.push({ text: '\n', color: rows.bottomBorder[0].color })
		for (const seg of rows.bottomBorder) out.push({ ...seg })
	}
	return out
}

// One border-free text_display representation of a small IntelliSense
// dropdown. Each row is its own `StyledSegment[]` so the popup can be
// rendered as N separate text_displays — one per row — and each
// row can carry its own `background` NBT.
export function buildPopupRows(items: string[]): StyledSegment[][] {
	const white: `#${string}` = '#ffffff'
	const longestItemLen = items.reduce((maxLen, item) => Math.max(maxLen, item.length), 0)
	return items.map((item): StyledSegment[] => {
		const out: StyledSegment[] = [
			{ text: '= ', color: white },
			{ text: item, color: white },
		]
		const padLen = longestItemLen - item.length
		if (padLen > 0) out.push({ text: ' '.repeat(padLen), color: white })
		return out
	})
}

// Local min-line-width fallback for fit-content on autocomplete. Uses
// the same CodeBorders.buildRows output but strips the borders so we
// can read the natural char count.
export function computeMinCodeLineWidthPxCompat(content: string, _gutterChars: number): number {
	return codeBorders.buildRows({
		content,
		language: '',
		fontId: 'sandstone_summit_booth:monospace',
		lineWidthPx: 0,
		bold: false,
		borderColor: undefined,
		langColor: undefined,
		codeColor: undefined,
		precomputed: undefined,
		lineNumbers: false,
		lineCount: content.split('\n').length,
		gutterColor: undefined,
		sidePadding: [1, 1],
	}).outerWidth * 6
}

// Re-export for callers outside this directory (currently none).
export { CodeBorders }
export type _StylelessVNode = VNode // keeps type imports alive