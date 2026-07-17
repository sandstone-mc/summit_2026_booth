// Builders for `text_display` and `item_display` NBT. Each takes the
// pre-computed layout fields and returns the SymbolEntity record the
// summon command emits.

import { NBT } from 'sandstone'
import type { SymbolEntity } from 'sandstone/arguments'
import { DEFAULT_FONT_ID } from '../text-metrics'
import type { StyledSegment } from '../render'
import { parseColorInt } from './color'

/** Default text color for segments without an explicit override. */
const DEFAULT_TEXT_COLOR = '#ffffff' as const

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
	if (type === 'code' || type === 'explorer') out.font = 'sandstone_summit_booth:monospace'
	if (declarations.font) out.font = declarations.font as `${string}:${string}`
	return out
}

function buildSegment(
	seg: StyledSegment,
	declarations: Record<string, string>,
	type: string,
): NonNullable<SymbolEntity['text_display']['text']> {
	const out: NonNullable<SymbolEntity['text_display']['text']> = { text: seg.text }
	// Color, bold, italic, font are ALL set explicitly on every
	// segment. Minecraft's text component system merges sibling styles
	// when a later segment leaves a field unset — the field carries
	// over from the previous segment. Without an explicit reset, a
	// plain-text segment following a `` `code` `` span would inherit
	// the code span's gray color / monospace font. Defaults below
	// match MC's own defaults (`#ffffff` text, `false` bold/italic,
	// `minecraft:default` font).
	out.color = (seg.color ?? declarations.color ?? DEFAULT_TEXT_COLOR) as `#${string}`
	if (seg.bold === true) out.bold = true
	else if (seg.bold === false) out.bold = false
	else if (declarations.bold === 'true') out.bold = true
	else if (type === 'h1' || type === 'h2') out.bold = true
	else out.bold = false
	if (seg.italic === true) out.italic = true
	else if (seg.italic === false) out.italic = false
	else if (declarations.italic === 'true') out.italic = true
	else out.italic = false
	out.font = (seg.font ?? declarations.font ?? (type === 'code' || type === 'explorer' ? 'sandstone_summit_booth:monospace' : DEFAULT_FONT_ID)) as `${string}:${string}`
	// `seg.background` is stored but NOT rendered as a per-segment
	// field — MC text components have no per-component `background`.
	// The LESS `inline-code-bg` declaration is stored on the segment
	// for future per-entity fan-out (multiple item_display boxes
	// behind a single text_display entity to simulate per-span
	// highlights). For now, callers that want to render an inline-code
	// background will need the layout to emit highlight entities.
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