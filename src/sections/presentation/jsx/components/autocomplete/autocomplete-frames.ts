// Autocomplete frame baking — emits one MCFunction per typing stage.
// Each frame updates editor text, cursor translation, popup segment
// translation + text + opacity + line_width + background. The
// AnimatedComponent base's dispatcher invokes these when the stage
// index changes; the tick skips unchanged frames entirely.

import {
	NBT,
	MCFunction,
	execute,
	Selector,
	type MCFunctionClass,
} from 'sandstone'
import type { NBTObject } from 'sandstone/arguments'
import { buildTextJson } from '../summon-helpers'
import type { ComponentFrames } from '../animation-base'
import type { AutocompleteLayout } from './autocomplete-layout'
import { POPUP_WINDOW } from './autocomplete-constants'

export function bakeAutocompleteFrames(slideIdx: number, componentIdx: number, layout: AutocompleteLayout): ComponentFrames {
	const fns: MCFunctionClass[] = []
	const hashes: string[] = []
	for (let si = 0; si < layout.stageCount; si++) {
		const stageIdx = si
		const slideTag = layout.path[0] ?? ''
		const editorSel = Selector('@e', {
			tag: [`ac_editor_${slideIdx}_${componentIdx}` as `${any}${string}`, slideTag as `${any}${string}`],
		})
		const cursorSel = Selector('@e', {
			tag: [`ac_cursor_${slideIdx}_${componentIdx}` as `${any}${string}`, slideTag as `${any}${string}`],
		})
		const popupSegmentSels: ReturnType<typeof Selector>[] = []
		for (let sIdx = 0; sIdx < layout.popupSegments.length; sIdx++) {
			popupSegmentSels.push(
				Selector('@e', {
					tag: [
						`ac_popup_${slideIdx}_${componentIdx}_seg_${sIdx}` as `${any}${string}`,
						slideTag as `${any}${string}`,
					],
				}),
			)
		}
		const fn = MCFunction(`presentation/slides/autocomplete_stage/${slideIdx}_${componentIdx}/${stageIdx}`, () => {
			const editorJson = buildTextJson(
				layout.stages[stageIdx].editorContent,
				layout.declarations,
				'code',
			)
			execute.as(editorSel).run.data.modify
				.entity('@s', 'text')
				.set.value(editorJson as NBTObject)

			const cx = layout.stages[stageIdx].cursorXBlocks
			const cy = layout.stages[stageIdx].cursorYBlocks
			const cursorTr = NBT.float([cx, cy, 0])
			execute.as(cursorSel).run.data.modify
				.entity('@s', 'transformation.translation')
				.set.value(cursorTr as NBTObject)

			const popupVisibleAtStage = layout.stages[stageIdx].popupVisible
			const popupQuadHalfWidthBlocksAtStage = layout.popupWidthPxPerStage[stageIdx] / 64
			const inNbtRangeForPopup =
				stageIdx >= layout.nbtStageStart && stageIdx < layout.nbtStageStart + POPUP_WINDOW
			const popupAnchorX =
				cx + layout.cursorWidthBlocks / 2 + popupQuadHalfWidthBlocksAtStage + 1.2 -
				(inNbtRangeForPopup ? 0.5 : 0)
			const popupAnchorY = cy + layout.cursorHeightBlocks + (layout.popupLineHeightBlocks * 0.5)

			if (popupVisibleAtStage) {
				for (let sIdx = 0; sIdx < layout.popupSegments.length; sIdx++) {
					const segTr = NBT.float([
						popupAnchorX,
						popupAnchorY + layout.popupSegments[sIdx].offsetYBlocks,
						0,
					])
					execute.as(popupSegmentSels[sIdx]).run.data.modify
						.entity('@s', 'transformation.translation')
						.set.value(segTr as NBTObject)
				}
			}

			const visible = popupVisibleAtStage ? -1 : 0
			const segContent = layout.stages[stageIdx].popupSegmentContent
			for (let sIdx = 0; sIdx < layout.popupSegments.length; sIdx++) {
				const segSel = popupSegmentSels[sIdx]
				const content = segContent[sIdx]
				if (content.length > 0) {
					const segJson = buildTextJson(content, layout.declarations, 'autocomplete')
					execute.as(segSel).run.data.modify
						.entity('@s', 'text')
						.set.value(segJson as NBTObject)
				}
				execute.as(segSel).run.data.modify
					.entity('@s', 'text_opacity')
					.set.value(NBT.int(visible))
				if (layout.popupWidthPxPerStage[stageIdx] > 0) {
					execute.as(segSel).run.data.modify
						.entity('@s', 'line_width')
						.set.value(NBT.int(layout.popupWidthPxPerStage[stageIdx]) as NBTObject)
				}
				const bgNbt = visible !== 0
					? NBT.int(layout.popupSegments[sIdx].bgInt)
					: NBT.int(0)
				execute.as(segSel).run.data.modify
					.entity('@s', 'background')
					.set.value(bgNbt as NBTObject)
			}
		})
		fns.push(fn)
		// Hash the rendered state of this stage: editor content, cursor
		// translation, popup visibility + content + width + background.
		// Two stages with identical state are visually indistinguishable
		// so the dispatcher can drop the duplicate case.
		const stage = layout.stages[stageIdx]
		const payload = JSON.stringify({
			editor: stage.editorContent,
			cursor: [stage.cursorXBlocks, stage.cursorYBlocks],
			popupVisible: stage.popupVisible,
			popupContent: stage.popupSegmentContent,
			width: layout.popupWidthPxPerStage[stageIdx],
			bg: layout.popupSegments.map((s) => s.bgInt),
		})
		hashes.push(Bun.hash(payload).toString(16))
	}
	return { frameFns: fns, hashes, state: layout }
}