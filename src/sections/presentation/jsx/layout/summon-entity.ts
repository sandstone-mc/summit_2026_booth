// Emit `summon text_display / item_display ...` commands for a single
// element or row-flow block. Must run inside an MCFunction callback —
// the commands attach to the active MCFunction.

import { summon, NBT, type LabelClass } from 'sandstone'
import type { SymbolEntity } from 'sandstone/arguments'
import { parseColorInt } from './color'
import { buildTextJson, buildIdentityTransform, applyBackgroundColor } from './nbt'
import { Z_VISUAL_OFFSET } from './constants'
import { KIND_TEXT_TAG } from '../slides/tags'
import type { ElementLayout } from './element'

const ROTATION_QUATERNION = NBT.float([0, 0, 0, 1])
const ZERO_TRANSLATION = NBT.float([0, 0, 0])
const FULL_BRIGHTNESS = { sky: NBT.int(15), block: NBT.int(15) } as const

// Format a number with `.0` suffix so NBT parser doesn't choke when
// downstream float contexts expect a decimal.
function fmt(v: number): string {
	return `${v}${Number.isInteger(v) ? '.0' : ''}`
}

export function summonTextEntity(
	el: Extract<ElementLayout, { kind: 'text' }>,
	entityX: number,
	entityY: number,
	z: number,
	extraTags: (`${any}${string}` | LabelClass)[],
	sceneTag: LabelClass,
	initialOpacity: number | undefined,
): void {
	if (el.chunks && el.chunks.length > 0 && el.scrollTag) {
		const tags: (`${any}${string}` | LabelClass)[] = [sceneTag, ...extraTags]
		tags.push(el.scrollTag as `${any}${string}`)
		const nbt: SymbolEntity['text_display'] = {
			Tags: tags,
			text: buildTextJson(el.chunks[0].content, el.declarations, el.type),
			transformation: buildIdentityTransform(el.textScale),
		}
		applyBackgroundColor(
			el.declarations,
			nbt as unknown as { background?: ReturnType<typeof NBT.int> },
		)
		if (el.width !== undefined)
			nbt.line_width = NBT.int(Math.round(el.width.px * el.widthCompensation))
		else if (el.declarations['line-width'])
			nbt.line_width = NBT.int(parseInt(el.declarations['line-width']))
		if (el.declarations.shadow === 'true') nbt.shadow = true
		if (el.declarations['see-through'] === 'true') nbt.see_through = true
		let align: 'center' | 'left' | 'right' | undefined
		if (el.type === 'code') align = 'left'
		const ta = el.declarations['text-align']?.toLowerCase().trim()
		if (ta === 'left' || ta === 'right' || ta === 'center') align = ta
		if (align) nbt.alignment = align
		// Scroll entity starts visible — slide show/hide owns visibility.
		nbt.text_opacity = NBT.int(-1)
		summon(
			'text_display',
			`${fmt(entityX)} ${fmt(entityY)} ${fmt(z)}`,
			nbt,
		)
		return
	}

	// Single entity (non-scroll, or scroll with no chunks).
	const tags: (`${any}${string}` | LabelClass)[] = [sceneTag, ...extraTags]
	if (el.scrollTag) tags.push(el.scrollTag as `${any}${string}`)
	const nbt: SymbolEntity['text_display'] = {
		Tags: tags,
		text: buildTextJson(el.borderedContent ?? el.content, el.declarations, el.type),
		transformation: buildIdentityTransform(el.textScale),
	}

	applyBackgroundColor(el.declarations, nbt as unknown as { background?: ReturnType<typeof NBT.int> })
	if (el.width !== undefined) nbt.line_width = NBT.int(Math.round(el.width.px * el.widthCompensation))
	else if (el.declarations['line-width']) nbt.line_width = NBT.int(parseInt(el.declarations['line-width']))
	if (el.declarations.shadow === 'true') nbt.shadow = true
	if (el.declarations['see-through'] === 'true') nbt.see_through = true

	// `<code>` defaults to left-aligned (code editor style); LESS overrides.
	let align: 'center' | 'left' | 'right' | undefined
	if (el.type === 'code') align = 'left'
	const ta = el.declarations['text-align']?.toLowerCase().trim()
	if (ta === 'left' || ta === 'right' || ta === 'center') align = ta
	if (align) nbt.alignment = align

	const opacityStr = el.declarations.opacity
	if (initialOpacity !== undefined) {
		nbt.text_opacity = NBT.int(initialOpacity)
	} else if (opacityStr) {
		// Stored as -256 + bytes — values 0-3 clamp to 255 in MC 1.21.9,
		// so subtract 256 to make those genuinely transparent.
		nbt.text_opacity = NBT.int(Math.round((parseFloat(opacityStr) / 100) * 255) - 256)
	}

	summon('text_display', `${fmt(entityX)} ${fmt(entityY)} ${fmt(z)}`, nbt)
}

export function summonImageEntity(
	el: Extract<ElementLayout, { kind: 'image' }>,
	entityX: number,
	entityY: number,
	z: number,
	extraTags: (`${any}${string}` | LabelClass)[],
	sceneTag: LabelClass,
	initialOpacity: number | undefined,
): void {
	// `paper` is a no-op shape; `minecraft:item_model` overrides it fully.
	// `item_display: 'fixed'` makes the model 2D regardless of viewer angle.
	// `entityY` is the vertical center of the image cell — the layout
	// computed it (cellY + cellH/2) before calling here.
	const imgNbt: SymbolEntity['item_display'] = {
		Tags: [sceneTag, ...extraTags],
		item: {
			id: 'minecraft:paper',
			count: NBT.int(1),
			components: {
				// SNBT keys with `:` must be pre-quoted to dodge the parser
				// treating the colon as a type-tag.
				/* @ts-ignore — TODO: Sandstone bug; unquoted `minecraft:item_model` should work after the fix. */
				'"minecraft:item_model"': el.imgItemModel!,
			},
		},
		item_display: 'fixed',
		transformation: {
			scale: NBT.float([el.cellW, el.cellH, 1]),
			translation: ZERO_TRANSLATION,
			left_rotation: ROTATION_QUATERNION,
			right_rotation: ROTATION_QUATERNION,
		},
		brightness: FULL_BRIGHTNESS,
	}
	if (initialOpacity === 0) imgNbt.view_range = NBT.float(0.0)
	summon('minecraft:item_display', `${fmt(entityX)} ${fmt(entityY)} ${fmt(z)}`, imgNbt)
}

// Internal helper — dispatches to text vs image entity summoner.
export function summonElement(
	el: ElementLayout,
	entityX: number,
	entityY: number,
	z: number,
	extraTags: (`${any}${string}` | LabelClass)[],
	sceneTag: LabelClass,
	initialOpacity: number | undefined,
): void {
	if (el.kind === 'text') {
		summonTextEntity(
			el,
			entityX,
			entityY,
			z,
			[...extraTags, KIND_TEXT_TAG],
			sceneTag,
			initialOpacity,
		)
	} else {
		summonImageEntity(el, entityX, entityY, z, extraTags, sceneTag, initialOpacity)
	}
}

export { Z_VISUAL_OFFSET }

// Re-exports for callers that don't want to pull every layout sub-module.
export { buildTextJson } from './nbt'