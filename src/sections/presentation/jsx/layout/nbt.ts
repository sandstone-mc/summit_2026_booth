// Builders for `text_display` and `item_display` NBT. Each takes the
// pre-computed layout fields and returns the SymbolEntity record the
// summon command emits.

import { NBT } from 'sandstone'
import type { SymbolEntity } from 'sandstone/arguments'
import type { StyledSegment } from '../render'
import { parseColorInt } from './color'

// Build the `text` field for a text_display. Single string → one
// color from `declarations.color`; array of segments → each segment
// carries its own color/font, falling back to declarations.
export function buildTextJson(
	content: string | StyledSegment[],
	declarations: Record<string, string>,
	type: string,
): SymbolEntity['text_display']['text'] {
	if (Array.isArray(content)) {
		return content.map((seg) => buildSegment(seg, declarations, type)) as SymbolEntity['text_display']['text']
	}
	const out: SymbolEntity['text_display']['text'] = { text: content }
	if (declarations.color) out.color = declarations.color as `#${string}`
	if (declarations.bold === 'true') out.bold = true
	if (declarations.italic === 'true') out.italic = true
	if (declarations.underline === 'true') out.underlined = true
	if (declarations.strikethrough === 'true') out.strikethrough = true
	if (declarations.obfuscated === 'true') out.obfuscated = true
	if (type === 'h1' || type === 'h2') out.bold = true
	if (type === 'code') out.font = 'monocraft:default'
	if (declarations.font) out.font = declarations.font as `${string}:${string}`
	return out
}

function buildSegment(
	seg: StyledSegment,
	declarations: Record<string, string>,
	type: string,
): NonNullable<SymbolEntity['text_display']['text']> {
	const out: NonNullable<SymbolEntity['text_display']['text']> = { text: seg.text }
	const color = seg.color ?? (declarations.color as `#${string}` | undefined)
	if (color) out.color = color
	if (declarations.bold === 'true') out.bold = true
	if (type === 'h1' || type === 'h2') out.bold = true
	const font = seg.font ?? declarations.font
	if (font) out.font = font as `${string}:${string}`
	else if (type === 'code') out.font = 'monocraft:default'
	return out
}

// Unit-rotation quaternion components `(0, 0, 0, 1)` — every display
// entity emits this verbatim for both `left_rotation` + `right_rotation`.
const ROTATION_QUATERNION = NBT.float([0, 0, 0, 1])
const ZERO_TRANSLATION = NBT.float([0, 0, 0])

// Build a 4-component identity transformation. The shape mirrors the
// original render.ts call sites — `NBT.float` returns an array; we
// wrap it three times so the encoder emits one axis each.
export function buildIdentityTransform(s: number) {
	const sf = NBT.float(s)
	return {
		scale: [sf, sf, sf],
		translation: ZERO_TRANSLATION,
		left_rotation: ROTATION_QUATERNION,
		right_rotation: ROTATION_QUATERNION,
	}
}

// Parse a `#RRGGBB` color into the int text_display wants.
export function applyBackgroundColor(decs: Record<string, string>, nbt: { background?: ReturnType<typeof NBT.int> }): void {
	const bg = decs.background ? parseColorInt(decs.background) : undefined
	if (bg !== undefined) {
		const bgi = NBT.int(bg)
		nbt.background = bgi as unknown as ReturnType<typeof NBT.int>
	}
}