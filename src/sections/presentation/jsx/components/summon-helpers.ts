// Shared NBT + format helpers used by every component's summon step.
// `buildTextJson` handles single string vs array of segments + per-type
// font/bold overrides; `buildIdentityTransform` produces the standard
// scale-only transform for text_display entities.

import { NBT } from 'sandstone'
import type { SymbolEntity } from 'sandstone/arguments'
import { DEFAULT_FONT_ID } from '../text-metrics'
import type { StyledSegment } from '../render'
import { parseColorInt } from '../layout/color'

const DEFAULT_TEXT_COLOR = '#ffffff' as const

// Unit rotation quaternion `(0, 0, 0, 1)` — emitted verbatim for both
// `left_rotation` + `right_rotation` on every display entity.
export const ROTATION_QUATERNION = NBT.float([0, 0, 0, 1])
export const ZERO_TRANSLATION = NBT.float([0, 0, 0])
export const FULL_BRIGHTNESS = { sky: NBT.int(15), block: NBT.int(15) } as const

// Format a number with `.0` suffix when integer so the NBT parser
// doesn't choke when downstream float contexts expect a decimal.
export function fmt(v: number): string {
	return `${v}${Number.isInteger(v) ? '.0' : ''}`
}

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
	if (type === 'code' || type === 'explorer' || type === 'autocomplete') out.font = 'sandstone_summit_booth:monospace'
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
	// segment — MC text components merge sibling styles when a later
	// segment leaves a field unset. Defaults below match MC's own.
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
	out.font = (seg.font ?? declarations.font ?? (type === 'code' || type === 'explorer' || type === 'autocomplete' ? 'sandstone_summit_booth:monospace' : DEFAULT_FONT_ID)) as `${string}:${string}`
	// `seg.background` is stored but NOT rendered — MC text components
	// have no per-component `background`. Reserved for future per-entity
	// fan-out (multiple item_display boxes behind a single text_display).
	return out
}

// 4-component identity transformation. Shape mirrors the original
// `render.ts` call sites — `NBT.float` returns an array; wrap it three
// times so the encoder emits one axis each.
export function buildIdentityTransform(s: number) {
	const sf = NBT.float(s)
	return {
		scale: [sf, sf, sf],
		translation: ZERO_TRANSLATION,
		left_rotation: ROTATION_QUATERNION,
		right_rotation: ROTATION_QUATERNION,
	}
}

// Parse `#RRGGBB` color into the int text_display wants. Caller always
// gets an opaque color — alpha byte forced to 0xFF.
export function applyBackgroundColor(decs: Record<string, string>, nbt: { background?: ReturnType<typeof NBT.int> }): void {
	const bg = decs.background ? parseColorInt(decs.background) : undefined
	if (bg !== undefined) {
		const bgi = NBT.int(bg)
		nbt.background = bgi as unknown as ReturnType<typeof NBT.int>
	}
}

// Parse the `side-padding` JSX prop. Accepts a `[left, right]`
// tuple or a single number; returns the default `[1, 1]` when the
// prop is missing or malformed. Shared by code/explorer preps.
export function parseSidePadding(raw: unknown): [number, number] {
	if (Array.isArray(raw) && raw.length >= 2) {
		const l = Number(raw[0])
		const r = Number(raw[1])
		if (Number.isFinite(l) && Number.isFinite(r)) return [l, r]
	}
	if (typeof raw === 'number' && Number.isFinite(raw)) return [raw, raw]
	return [1, 1]
}
