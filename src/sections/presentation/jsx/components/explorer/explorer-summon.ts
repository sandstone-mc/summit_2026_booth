// Explorer summon — emits the text_display entity for non-scroll
// explorer or the scroll-entity-with-text-chunk at chunk 0 for scroll.

import { NBT, summon as mcSummon, type LabelClass } from 'sandstone'
import type { SymbolEntity } from 'sandstone/arguments'
import { buildTextJson, buildIdentityTransform, applyBackgroundColor, fmt } from '../summon-helpers'
import { KIND_TEXT_TAG } from '../../slides/tags'
import type { StyledSegment } from '../../render'
import type { ExplorerLayout } from './explorer-layout'

export function explorerSummon(
	el: ExplorerLayout,
	entityX: number,
	entityY: number,
	z: number,
	extraTags: (`${any}${string}` | LabelClass)[],
	sceneTag: LabelClass,
	_initialOpacity: number | undefined,
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
		}
		nbt.alignment = 'left'
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
	nbt.alignment = 'left'
	mcSummon('text_display', `${fmt(entityX)} ${fmt(entityY)} ${fmt(z)}`, nbt)
}