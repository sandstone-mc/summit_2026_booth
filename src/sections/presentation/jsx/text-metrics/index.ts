// Public text-metrics API.
//
// Wraps the singleton `FontLoader` so consumers don't need to manage
// loader instances themselves. `loadFontMetrics` must be awaited
// before any `charWidth` / `wrapLines` / `fontMetrics` call for that font.

import { FontLoader, DEFAULT_FONT_ID, type FontMetrics } from './font-loader'
import { TextWrap, type CodeLineWrap } from './wrap'

export type { CodeLineWrap } from './wrap'

export { DEFAULT_FONT_ID } from './font-loader'

const loader = new FontLoader()
const wrap = new TextWrap(loader)

export async function loadFontMetrics(fontId: string = DEFAULT_FONT_ID): Promise<void> {
	return loader.load(fontId)
}

export function charWidth(ch: string, bold: boolean, fontId: string = DEFAULT_FONT_ID): number {
	return loader.charWidth(ch, bold, fontId)
}

export function textWidth(text: string, bold: boolean, fontId: string = DEFAULT_FONT_ID): number {
	return loader.textWidth(text, bold, fontId)
}

export function fontMetrics(fontId: string = DEFAULT_FONT_ID): FontMetrics {
	return loader.fontMetrics(fontId)
}

export function wrapLines(
	text: string,
	lineWidth: number,
	bold: boolean,
	fontId: string = DEFAULT_FONT_ID,
): number {
	return wrap.wrapLines(text, lineWidth, bold, fontId)
}

export function wrapToLines(
	text: string,
	lineWidth: number,
	bold: boolean,
	fontId: string = DEFAULT_FONT_ID,
): string[] {
	return wrap.wrapToLines(text, lineWidth, bold, fontId)
}

export function wrapCodeLinesAsArray(
	text: string,
	_maxChars: number,
	_bold: boolean,
	_fontId: string = DEFAULT_FONT_ID,
): string[] {
	return wrap.wrapCodeLinesAsArrayMonospace(text, _maxChars)
}

/** Same as `wrapCodeLinesAsArray` but each entry also tracks its source line. */
export function wrapCodeLinesAsTuples(
	text: string,
	_maxChars: number,
	_bold: boolean,
	_fontId: string = DEFAULT_FONT_ID,
): { line: string; sourceLine: number }[] {
	return wrap.wrapCodeLinesAsTuplesMonospace(text, _maxChars)
}

/** Total visual lines a `<code>` source produces when wrapped in monospace. */
export function wrapCodeLinesMonospace(text: string, maxChars: number): number {
	return wrap.wrapCodeLinesMonospace(text, maxChars)
}

/**
 * Same monospace wrap as `wrapCodeLinesAsArray` but each returned row
 * also carries the source-line-relative `[bodyStart, bodyEnd)` range
 * of the body chars it contains. Lets callers tokenize the *raw*
 * source first and slice the resulting segments into visual rows
 * without ever splitting a token at the wrap boundary.
 */
export function wrapCodeLinesWithOffsets(text: string, maxChars: number): CodeLineWrap[] {
	return wrap.wrapCodeLinesWithOffsets(text, maxChars)
}