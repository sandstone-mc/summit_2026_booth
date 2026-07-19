// Autocomplete summon — emits the editor + cursor + per-popup-segment
// text_display entities. Mount-time only; per-stage updates happen
// via the baked MCFunctions in `autocomplete-frames.ts`.

import { NBT, summon as mcSummon, type LabelClass } from 'sandstone'
import type { SymbolEntity } from 'sandstone/arguments'
import { buildTextJson, buildIdentityTransform, applyBackgroundColor, fmt, ROTATION_QUATERNION } from '../summon-helpers'
import { KIND_TEXT_TAG } from '../../slides/tags'
import type { AutocompleteLayout } from './autocomplete-layout'

export function autocompleteSummon(
	el: AutocompleteLayout,
	entityX: number,
	entityY: number,
	z: number,
	extraTags: (`${any}${string}` | LabelClass)[],
	sceneTag: LabelClass,
	_initialOpacity: number | undefined,
): void {
	const autoId = el.autoId
	const tags = [sceneTag, ...extraTags, KIND_TEXT_TAG] as (`${any}${string}` | LabelClass)[]
	const stage0 = el.stages[0]

	// Editor entity — bordered code box at the cell's standard Y.
	const editorTags = [...tags, `ac_editor_${autoId}` as `${any}${string}`]
	const editorNbt: SymbolEntity['text_display'] = {
		Tags: editorTags,
		text: buildTextJson(stage0.editorContent, el.declarations, 'code'),
		transformation: buildIdentityTransform(el.textScale),
	}
	applyBackgroundColor(el.declarations, editorNbt as unknown as { background?: ReturnType<typeof NBT.int> })
	if (el.styleWidth !== undefined) {
		editorNbt.line_width = NBT.int(Math.round(el.styleWidth.px * el.widthCompensation))
	}
	editorNbt.alignment = 'left'
	editorNbt.text_opacity = NBT.int(-1)
	mcSummon('text_display', `${fmt(entityX)} ${fmt(entityY)} ${fmt(z)}`, editorNbt)

	// Cursor entity — sits at the editor's Y. Per-tick `data modify
	// entity @s transformation.translation` moves the caret.
	const cursorTags = [...tags, `ac_cursor_${autoId}` as `${any}${string}`]
	const cursorTranslation = NBT.float([stage0.cursorXBlocks, stage0.cursorYBlocks, 0])
	const cursorNbt: SymbolEntity['text_display'] = {
		Tags: cursorTags,
		text: { text: '|', color: el.cursorColor },
		transformation: {
			translation: cursorTranslation,
			left_rotation: ROTATION_QUATERNION,
			right_rotation: ROTATION_QUATERNION,
			scale: NBT.float([el.textScale, el.textScale, el.textScale]),
		},
		background: NBT.int(0),
		alignment: 'left',
		text_opacity: NBT.int(-1),
	}
	mcSummon('text_display', `${fmt(entityX)} ${fmt(entityY)} ${fmt(z)}`, cursorNbt)

	// Popup segment entities — one text_display per bg-color run.
	// Initial content is taken from the first stage with non-empty
	// popup content so the quad isn't degenerate before the first
	// tick.
	const stage0WithContent =
		el.stages.find((s) => s.popupSegmentContent.some((c) => c.length > 0))
		?? el.stages[0]
	for (let segIdx = 0; segIdx < el.popupSegments.length; segIdx++) {
		const seg = el.popupSegments[segIdx]
		const segTags = [...tags, `ac_popup_${autoId}_seg_${segIdx}` as `${any}${string}`]
		const segNbt: SymbolEntity['text_display'] = {
			Tags: segTags,
			text: buildTextJson(
				stage0WithContent.popupSegmentContent[segIdx] ?? [],
				el.declarations,
				'autocomplete',
			),
			transformation: buildIdentityTransform(el.textScale),
			alignment: 'left',
			text_opacity: NBT.int(0),
		}
		if (seg.bgInt) segNbt.background = NBT.int(seg.bgInt)
		if (el.popupWidthPxPerStage.length > 0 && el.popupWidthPxPerStage[0] > 0) {
			segNbt.line_width = NBT.int(el.popupWidthPxPerStage[0])
		}
		mcSummon('text_display', `${fmt(entityX)} ${fmt(entityY)} ${fmt(z + 0.04)}`, segNbt)
	}
}