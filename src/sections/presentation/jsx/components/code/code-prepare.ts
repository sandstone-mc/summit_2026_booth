// Code prep — async pre-compute for `<code>` blocks. Called from
// `CodeComponent.prepare()` once per render pass. Steps:
//   1. Ensure tree-sitter grammars are on disk (auto-fetch).
//   2. Wrap + tokenize every visible `<code>` block's source.
//   3. Write per-block `Precomputed` into the WeakMap returned to
//      the layout pass via `ctx.result`.

import { wrapCodeLinesWithOffsets, type CodeLineWrap } from '../../text-metrics'
import { parseLength, pxToTextScale } from '../../length'
import type { Styles } from '../../style'
import type { VNode, StyledSegment } from '../../render'
import type { NodeWithPath } from '../../tree/walk'
import { extractCodeSource } from '../../tree/extract'
import { computeMinCodeLineWidthPx, DEFAULT_MONO_CHAR_PX, type Precomputed } from './code-borders'
import type { RowFlexWidth } from '../../layout/row-flex'
import { precomputeHighlights } from './highlight'
import { GRAMMARS, ensureGrammars } from './code-grammar'

// Default scale (in font-pixel units) for `<code>` blocks when
// LESS doesn't specify `font-size`.
const CODE_DEFAULT_SCALE_PX = 8

export async function prepareCodeComponents(
	visiblePerSlide: NodeWithPath[][],
	styles: Styles,
	sceneW: number,
	sceneH: number,
	rowFlexWidths: WeakMap<VNode, RowFlexWidth> = new WeakMap(),
): Promise<WeakMap<VNode, Precomputed>> {
	await ensureGrammars()
	const map: WeakMap<VNode, Precomputed> = new WeakMap()

	type Entry = {
		node: VNode
		source: string
		lang: string
		codeLineWraps: CodeLineWrap[]
		sourceLineStarts: number[]
	}
	const entries: Entry[] = []
	for (const visible of visiblePerSlide) {
		for (const { node, path } of visible) {
			if (node.type !== 'code') continue
			const lang = String(node.props?.lang ?? '')
			if (!lang) continue
			const source = extractCodeSource(node.props)
			if (!source) continue
			const declarations = styles.forPath(path)
			const fontId = declarations.font ?? 'sandstone_summit_booth:monospace'
			const fontSize = parseLength(declarations['font-size'] ?? '', sceneH)
			let width = parseLength(declarations.width ?? '', sceneW)
			const scalePx = fontSize?.px ?? 8
			const textScale = pxToTextScale(scalePx)
			const BASELINE_TEXT_SCALE = pxToTextScale(10)
			const widthCompensation = BASELINE_TEXT_SCALE / textScale
			const lineNumbers =
				node.props?.['line-numbers'] === true || node.props?.['line-numbers'] === 'true'
			const sourceLineCount = source.split('\n').length
			const gutterChars = lineNumbers ? Math.max(2, String(sourceLineCount).length) : 0
			if (width === undefined) {
				const minLineWidthPx = computeMinCodeLineWidthPx(source, gutterChars)
				const pxInDefault = minLineWidthPx / widthCompensation
				width = { value: pxInDefault, unit: 'px', px: pxInDefault, meters: pxInDefault / 16 }
			}
			const flexOverride = rowFlexWidths.get(node)
			if (flexOverride) {
				width = {
					value: flexOverride.widthPx,
					unit: 'px',
					px: flexOverride.widthPx,
					meters: flexOverride.widthMeters,
				}
			}
			const wrapWidthPx = (width?.px ?? Number.POSITIVE_INFINITY) * widthCompensation
			const maxRowChars = Math.max(10, Math.floor(wrapWidthPx / DEFAULT_MONO_CHAR_PX) - 2)
			const internalOverhead = gutterChars ? gutterChars + 5 : 2
			const maxCodeChars = Math.max(10, maxRowChars - internalOverhead)
			const wrapCodeChars = Math.max(10, maxCodeChars)
			const codeLineWraps = wrapCodeLinesWithOffsets(source, wrapCodeChars)
			const sourceLineStarts: number[] = (() => {
				const starts: number[] = [0]
				let offset = -1
				for (const ch of source) {
					offset++
					if (ch === '\n') starts.push(offset + 1)
				}
				return starts
			})()
			entries.push({ node, source, lang, codeLineWraps, sourceLineStarts })
		}
	}

	const lookup = await precomputeHighlights(GRAMMARS, entries.map((e) => ({ source: e.source, lang: e.lang })))

	for (const entry of entries) {
		const allSegments = lookup(entry.source, entry.lang) as StyledSegment[] | null
		const highlightedPerSourceLine: Array<StyledSegment[] | null> = allSegments
			? splitSegmentsBySourceLine(allSegments, entry.sourceLineStarts, entry.source)
			: entry.sourceLineStarts.map(() => null)
		const leadingLenPerSourceLine: number[] = entry.sourceLineStarts.map(() => 0)
		for (const w of entry.codeLineWraps) {
			if (leadingLenPerSourceLine[w.sourceLine] === 0 && w.leadingLen > 0) {
				leadingLenPerSourceLine[w.sourceLine] = w.leadingLen
			}
		}
		map.set(entry.node, {
			codeLines: entry.codeLineWraps.map((w) => w.visualLine),
			sourceLineOfVisualRow: entry.codeLineWraps.map((w) => w.sourceLine),
			codeLineWraps: entry.codeLineWraps,
			highlightedPerSourceLine,
			leadingLenPerSourceLine,
		})
	}
	return map
}

// Split a flat `StyledSegment[]` (covering the entire raw source) into
// per-source-line arrays. Segment positions are implicit — `cursor`
// tracks each segment's start in source coords as we walk them in
// order.
function splitSegmentsBySourceLine(
	segments: StyledSegment[],
	sourceLineStarts: number[],
	source: string,
): StyledSegment[][] {
	const perLine: StyledSegment[][] = sourceLineStarts.map(() => [])
	let cursor = 0
	let segIdx = 0
	for (let k = 0; k < sourceLineStarts.length; k++) {
		const lineStart = sourceLineStarts[k]
		const lineEnd = k + 1 < sourceLineStarts.length ? sourceLineStarts[k + 1] : source.length
		while (segIdx < segments.length && cursor + segments[segIdx].text.length <= lineStart) {
			cursor += segments[segIdx].text.length
			segIdx++
		}
		while (segIdx < segments.length && cursor < lineEnd) {
			const seg = segments[segIdx]
			const segEnd = cursor + seg.text.length
			const overlapStart = Math.max(cursor, lineStart)
			const overlapEnd = Math.min(segEnd, lineEnd)
			const slice = seg.text.slice(overlapStart - cursor, overlapEnd - cursor)
			perLine[k].push({ text: slice, color: seg.color })
			if (segEnd > lineEnd) break
			cursor = segEnd
			segIdx++
		}
	}
	return perLine
}