// Code summon — emits the text_display entity for non-scroll code
// or the scroll-entity-with-text-chunk at chunk 0 for scroll code.
// Per-tick text swaps live in `code-frames.ts`.

import { NBT, summon as mcSummon, type LabelClass } from 'sandstone'
import type { SymbolEntity } from 'sandstone/arguments'
import { buildTextJson, buildIdentityTransform, applyBackgroundColor, fmt } from '../summon-helpers'
import { KIND_TEXT_TAG } from '../../slides/tags'
import type { StyledSegment } from '../../render'
import type { CodeLayout } from './code-layout'

export function codeSummon(
	el: CodeLayout,
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
		applyBackgroundColor(el.declarations, nbt as unknown as { background?: ReturnType<typeof NBT.int> })
		if (el.styleWidth !== undefined) {
			nbt.line_width = NBT.int(Math.round(el.styleWidth.px * el.widthCompensation))
		} else if (el.declarations['line-width']) {
			nbt.line_width = NBT.int(parseInt(el.declarations['line-width']))
		}
		if (el.declarations.shadow === 'true') nbt.shadow = true
		if (el.declarations['see-through'] === 'true') nbt.see_through = true
		let align: 'center' | 'left' | 'right' | undefined
		if (el.type === 'code') align = 'left'
		const ta = el.declarations['text-align']?.toLowerCase().trim()
		if (ta === 'left' || ta === 'right' || ta === 'center') align = ta
		if (align) nbt.alignment = align
		nbt.text_opacity = NBT.int(-1)
		mcSummon('text_display', `${fmt(entityX)} ${fmt(entityY)} ${fmt(z)}`, nbt)
		return
	}

	const tags: (`${any}${string}` | LabelClass)[] = [sceneTag, ...extraTags, KIND_TEXT_TAG]
	const textContent: string | StyledSegment[] = el.borderedContent ?? el.content
	const nbt: SymbolEntity['text_display'] = {
		Tags: tags,
		text: buildTextJson(textContent, el.declarations, el.type),
		transformation: buildIdentityTransform(el.textScale),
	}
	applyBackgroundColor(el.declarations, nbt as unknown as { background?: ReturnType<typeof NBT.int> })
	if (el.styleWidth !== undefined) nbt.line_width = NBT.int(Math.round(el.styleWidth.px * el.widthCompensation))
	else if (el.declarations['line-width']) nbt.line_width = NBT.int(parseInt(el.declarations['line-width']))
	if (el.declarations.shadow === 'true') nbt.shadow = true
	if (el.declarations['see-through'] === 'true') nbt.see_through = true

	let align: 'center' | 'left' | 'right' | undefined
	if (el.type === 'code') align = 'left'
	const ta = el.declarations['text-align']?.toLowerCase().trim()
	if (ta === 'left' || ta === 'right' || ta === 'center') align = ta
	if (align) nbt.alignment = align

	const opacityStr = el.declarations.opacity
	if (initialOpacity !== undefined) {
		nbt.text_opacity = NBT.int(initialOpacity)
	} else if (opacityStr) {
		nbt.text_opacity = NBT.int(Math.round((parseFloat(opacityStr) / 100) * 255) - 256)
	}

	mcSummon('text_display', `${fmt(entityX)} ${fmt(entityY)} ${fmt(z)}`, nbt)
}