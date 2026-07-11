// Public text-metrics API.
//
// Wraps the singleton `FontLoader` so consumers don't need to manage
// loader instances themselves. `loadFontMetrics` must be awaited
// before any `charWidth` / `wrapLines` call for that font.

import { FontLoader, DEFAULT_FONT_ID } from './font-loader'
import { TextWrap } from './wrap'

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

export function wrapToLines(
	text: string,
	lineWidth: number,
	bold: boolean,
	fontId: string = DEFAULT_FONT_ID,
): string[] {
	return wrap.wrapToLines(text, lineWidth, bold, fontId)
}

export function wrapLines(
	text: string,
	lineWidth: number,
	bold: boolean,
	fontId: string = DEFAULT_FONT_ID,
): number {
	return wrap.wrapLines(text, lineWidth, bold, fontId)
}

export function wrapCodeLines(
	text: string,
	lineWidth: number,
	bold: boolean,
	fontId: string = DEFAULT_FONT_ID,
): number {
	return wrap.wrapCodeLines(text, lineWidth, bold, fontId)
}

export function wrapCodeLinesAsArray(
	text: string,
	lineWidth: number,
	bold: boolean,
	fontId: string = DEFAULT_FONT_ID,
): string[] {
	return wrap.wrapCodeLinesAsArray(text, lineWidth, bold, fontId)
}