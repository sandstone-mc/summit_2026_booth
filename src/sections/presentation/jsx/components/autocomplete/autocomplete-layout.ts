// Autocomplete layout — type definition + per-element compute
// function. The component emits three layered text_display entities
// (editor + cursor + popup segments) and pre-computes per-typing-
// stage baked snapshots the per-tick MCFunction dispatches.

import { parseLength, pxToTextLineHeight, pxToTextScale } from '../../length'
import { charWidth } from '../../text-metrics'
import { DEFAULT_FONT_ID, textWidth } from '../../text-metrics'
import { parseColorInt } from '../../layout/color'
import { parseMarginBox } from '../../layout/margin'
import { CodeBorders } from '../code/code-borders'

// Default scale (in font-pixel units) for `<autocomplete>` blocks
// when LESS doesn't specify `font-size`.
const AUTOCOMPLETE_DEFAULT_SCALE_PX = 8
import type { ComponentLayoutBase } from '../base'
import type { StyledSegment, VNode } from '../../render'
import type { CssDeclarations } from '../../less/types'
import type { Styles } from '../../style'
import type { NodeWithPath } from '../../tree/walk'
import { DEFAULT_AUTOCOMPLETE_SOURCE, ENTITY_IDS, MAX_CODE_LINES, NBT_KEYS, POPUP_WINDOW } from './autocomplete-constants'
import { buildPaddedCodeBordered, buildPopupRows, computeMinCodeLineWidthPxCompat } from './autocomplete-helpers'

const codeBorders = new CodeBorders()

// Unique-id counter (per-build). Reset between pre-pass + summon
// pass via `resetAutocompleteIds()`.
let nextAutocompleteId = 0
export function resetAutocompleteIds(): void {
	nextAutocompleteId = 0
}

export type AutocompleteLayout = ComponentLayoutBase & {
	kind: 'autocomplete'
	type: 'autocomplete'
	content: string
	borderedContent?: StyledSegment[]
	styleWidth: ReturnType<typeof parseLength>
	scalePx: number
	textScale: number
	widthCompensation: number
	fontId: string
	autoId: string
	stageCount: number
	stages: {
		editorContent: StyledSegment[]
		cursorXBlocks: number
		cursorYBlocks: number
		popupVisible: boolean
		popupSegmentContent: StyledSegment[][]
		popupHighlightIdx: number
	}[]
	cursorBlink: number
	sourceLineCount: number
	popupTriggerColumnBlocks: number[]
	popupWidthPxPerStage: number[]
	popupSegments: {
		bgInt: number
		startRow: number
		endRow: number
		heightBlocks: number
		offsetYBlocks: number
	}[]
	cursorColor: `#${string}`
	cursorWidthBlocks: number
	cursorHeightBlocks: number
	popupLineHeightBlocks: number
	popupHeightBlocks: number
	entityStageStart: number
	nbtStageStart: number
}

function computeAutocompleteLayout(
	node: VNode,
	path: string[],
	parentStack: CssDeclarations,
	declarations: CssDeclarations,
	sceneW: number,
	sceneH: number,
): AutocompleteLayout {
	const autoId = `ac_${nextAutocompleteId++}`
	const content =
		(typeof node.props?.source === 'string' && node.props.source) ||
		DEFAULT_AUTOCOMPLETE_SOURCE
	const lang =
		(typeof node.props?.lang === 'string' && node.props.lang) || 'typescript'

	const fontSize = parseLength(declarations['font-size'] ?? '', sceneH)
	const scalePx = fontSize?.px ?? AUTOCOMPLETE_DEFAULT_SCALE_PX
	const textScale = pxToTextScale(scalePx)
	const BASELINE_TEXT_SCALE = pxToTextScale(10)
	const widthCompensation = BASELINE_TEXT_SCALE / textScale
	const fontId = declarations.font ?? 'sandstone_summit_booth:monospace'

	const widthRaw =
		(typeof node.props?.width === 'string' && node.props.width) ||
		declarations.width ||
		'50vw'
	let width = parseLength(widthRaw, sceneW)
	if (width === undefined || width.unit === 'fit-content') {
		const minLineWidthPx = computeMinCodeLineWidthPxCompat(content, 0)
		const pxInDefault = minLineWidthPx / widthCompensation
		width = { value: pxInDefault, unit: 'px', px: pxInDefault, meters: pxInDefault / 16 }
	}
	const heightLen = parseLength(
		(typeof node.props?.height === 'string' && node.props.height) ||
			declarations.height ||
			'32vh',
		sceneH,
	)
	const lineNumbers =
		node.props?.['line-numbers'] === true ||
		node.props?.['line-numbers'] === 'true' ||
		declarations['line-numbers'] === 'true'
	const sidePadding: [number, number] = Array.isArray(node.props?.['side-padding'])
		? (node.props['side-padding'] as [number, number])
		: [1, 1]
	const sourceLineCount = content.split('\n').length
	const gutterChars = lineNumbers ? Math.max(2, String(sourceLineCount).length) : 0

	const fullWrapWidthPx = (width?.px ?? sceneW * 16) * widthCompensation
	const codeRows = codeBorders.buildRows({
		content,
		language: lang,
		fontId,
		lineWidthPx: fullWrapWidthPx,
		bold: false,
		borderColor: declarations['border-color'] as `#${string}` | undefined,
		langColor: declarations['lang-color'] as `#${string}` | undefined,
		codeColor: declarations.color as `#${string}` | undefined,
		precomputed: undefined,
		lineNumbers,
		lineCount: sourceLineCount,
		gutterColor: declarations['gutter-color'] as `#${string}` | undefined,
		sidePadding,
	})
	const lineHeightBlocks = pxToTextLineHeight(scalePx, fontId)
	const totalVisualLines = codeRows.codeRows.length + 2
	const cellH = heightLen?.meters ?? lineHeightBlocks * totalVisualLines
	const cellW = width?.meters ?? sceneW
	const { top: marginTop, bottom: marginBottom } = parseMarginBox(declarations, sceneH)
	const cursorBlink = 5

	const entityStageStart =
		typeof node.props?.['intellisense-entity-stage'] === 'number'
			? (node.props['intellisense-entity-stage'] as number)
			: 10
	const nbtStageStart =
		typeof node.props?.['intellisense-nbt-stage'] === 'number'
			? (node.props['intellisense-nbt-stage'] as number)
			: 47

	const cursorColor = ((declarations['cursor-color'] as `#${string}` | undefined) ?? '#ffffff') as `#${string}`

	const popupFontId = declarations.font ?? 'sandstone_summit_booth:monospace'
	const widestEntityRow = '= ' + ENTITY_IDS.reduce((a, b) =>
		textWidth(b, false, popupFontId) > textWidth(a, false, popupFontId) ? b : a,
	)
	const widestNbtRow = '= ' + NBT_KEYS.reduce((a, b) =>
		textWidth(b, false, popupFontId) > textWidth(a, false, popupFontId) ? b : a,
	)
	const widestEntityRowPx = textWidth(widestEntityRow, false, popupFontId)
	const widestNbtRowPx = textWidth(widestNbtRow, false, popupFontId)

	const popupBg = declarations['popup-bg'] as `#${string}` | undefined
	const otherRowBg = declarations['popup-other-bg'] as `#${string}` | undefined
	const selectedRowBgInt: number = popupBg ? (parseColorInt(popupBg) ?? 0) : 0
	const otherRowBgInt: number = otherRowBg ? (parseColorInt(otherRowBg) ?? 0) : 0
	const popupMaxRowCount = Math.max(ENTITY_IDS.length, NBT_KEYS.length)
	const rowBgInts: number[] = Array.from(
		{ length: popupMaxRowCount },
		(_, idx) => (idx === 0 ? selectedRowBgInt : otherRowBgInt),
	)

	const cursorFontId = declarations.font ?? DEFAULT_FONT_ID
	const cursorCharWidthPx = charWidth('|', false, cursorFontId)
	const cursorWidthBlocks = (cursorCharWidthPx * textScale) / 32
	const cursorHeightBlocks = pxToTextLineHeight(scalePx, cursorFontId)
	const popupLineHeightBlocks = pxToTextLineHeight(scalePx, popupFontId)
	const popupHeightBlocks = popupLineHeightBlocks * ENTITY_IDS.length

	type Segment = AutocompleteLayout['popupSegments'][number]
	const popupSegments: Segment[] = (() => {
		const segs: Segment[] = []
		let s = 0
		while (s < popupMaxRowCount) {
			const bgInt = rowBgInts[s]
			let e = s + 1
			while (e < popupMaxRowCount && rowBgInts[e] === bgInt) e++
			const heightBlocks = (e - s) * popupLineHeightBlocks
			let offsetYBlocks =
				popupHeightBlocks / 2 - s * popupLineHeightBlocks - (e - s) * popupLineHeightBlocks / 2
			if (s === 0) offsetYBlocks += popupLineHeightBlocks
			segs.push({ bgInt, startRow: s, endRow: e, heightBlocks, offsetYBlocks })
			s = e
		}
		return segs
	})()

	const stages: AutocompleteLayout['stages'] = []
	const popupWidthPxPerStage: number[] = []
	const popupTriggerColumnBlocksPerStage: number[] = []
	for (let s = 0; s <= content.length; s++) {
		const slice = content.slice(0, s)
		const bordered = buildPaddedCodeBordered(
			slice, lang, fontId, fullWrapWidthPx, lineNumbers,
			sourceLineCount, declarations, sidePadding, MAX_CODE_LINES,
		)
		const newlinesBefore = (slice.match(/\n/g) ?? []).length
		const lastNewlineIdx = slice.lastIndexOf('\n')
		const colChars = lastNewlineIdx >= 0 ? slice.length - lastNewlineIdx - 1 : slice.length

		const charWidthBlocks = 0.375
		const CURSOR_HORIZONTAL_OFFSET_CHARS = 12
		const CURSOR_DRIFT_PER_CHAR = 0.07
		const paddingLeftBlocks = (sidePadding[0] + (lineNumbers ? gutterChars + 3 : 0) + 1) * charWidthBlocks
		const cursorXBlocks =
			paddingLeftBlocks +
			colChars * (charWidthBlocks - CURSOR_DRIFT_PER_CHAR) -
			CURSOR_HORIZONTAL_OFFSET_CHARS * charWidthBlocks -
			0.5
		const visualRowOfCursor = newlinesBefore + 2
		const cursorYBlocks = cellH - visualRowOfCursor * lineHeightBlocks

		const inEntityRange = s >= entityStageStart && s < entityStageStart + POPUP_WINDOW
		const inNbtRange = s >= nbtStageStart && s < nbtStageStart + POPUP_WINDOW
		const popupVisible = inEntityRange || inNbtRange
		const popupWidthPx: number = inNbtRange ? widestNbtRowPx : inEntityRange ? widestEntityRowPx : 0
		const rowSegments = popupVisible ? buildPopupRows(inNbtRange ? NBT_KEYS : ENTITY_IDS) : []
		const popupSegmentContent: StyledSegment[][] = popupSegments.map((seg) => {
			if (!popupVisible) return []
			const out: StyledSegment[] = []
			for (let r = seg.startRow; r < seg.endRow; r++) {
				if (r > seg.startRow) out.push({ text: '\n', color: '#ffffff' as `#${string}` })
				for (const s2 of rowSegments[r] ?? []) out.push({ ...s2 })
			}
			return out
		})
		const popupHighlightIdx = popupVisible ? 0 : -1
		const popupTriggerColumnBlocks =
			paddingLeftBlocks + colChars * charWidthBlocks + charWidthBlocks / 2

		popupWidthPxPerStage.push(popupWidthPx)
		popupTriggerColumnBlocksPerStage.push(popupTriggerColumnBlocks)
		stages.push({
			editorContent: bordered,
			cursorXBlocks,
			cursorYBlocks,
			popupVisible,
			popupSegmentContent,
			popupHighlightIdx,
		})
	}
	const stageCount = stages.length

	return {
		kind: 'autocomplete',
		node, path, parentStack, declarations, type: 'autocomplete',
		content, styleWidth: width, scalePx, textScale, widthCompensation,
		fontId, cellH, cellW, marginTop, marginBottom,
		autoId, stageCount, stages, cursorBlink, sourceLineCount,
		popupTriggerColumnBlocks: popupTriggerColumnBlocksPerStage,
		popupWidthPxPerStage, popupSegments, cursorColor,
		cursorWidthBlocks, cursorHeightBlocks,
		popupLineHeightBlocks, popupHeightBlocks,
		entityStageStart, nbtStageStart,
	}
}

export function autocompleteLayoutFor(
	nw: NodeWithPath,
	styles: Styles,
	sceneW: number,
	sceneH: number,
): AutocompleteLayout {
	const { node, path } = nw
	const parentStack =
		path.length === 0 ? ({} as CssDeclarations) : styles.forPathCached(path.slice(0, -1))
	const declarations = styles.forPath(path)
	return computeAutocompleteLayout(node, path, parentStack, declarations, sceneW, sceneH)
}

// Re-export internal layout function for tests / sibling files.
export { computeAutocompleteLayout }