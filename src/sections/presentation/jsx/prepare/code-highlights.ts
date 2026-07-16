// Pre-compute `<code>` block highlights BEFORE the synchronous layout
// pass. Each VNode gets a `Precomputed` entry containing the wrapped
// line list + tree-sitter styled segments (split per source line), so
// the layout pass can look them up without re-wrapping or re-parsing.

import { wrapCodeLinesWithOffsets, type CodeLineWrap } from '../text-metrics'
import { parseLength, pxToTextScale } from '../length'
import type { Styles } from '../style'
import type { VNode, StyledSegment } from '../render'
import type { NodeWithPath } from '../tree/walk'
import { extractCodeSource } from '../tree/extract'
import { defaultFontPx } from '../layout/constants'
import { computeMinCodeLineWidthPx, DEFAULT_MONO_CHAR_PX } from '../layout/code-borders'
import type { Precomputed } from '../layout/code-borders'
import type { RowFlexWidth } from './row-flex'
import { precomputeHighlights } from '../highlight'
import { GRAMMARS } from '../layout/constants'

// Tokenize the *raw* source (with original `\n` separators) and split
// the resulting segments by source line. The layout pass then slices
// each source line's segments into the visual rows its wrap produced.
// Highlighting the joined-wrapped output instead would lose tokens
// that landed across a wrap boundary (e.g. `function` wrapping to
// `func\n tion` — the tokenizer would see `func` + `\n` + `tion` and
// fail to recognize the keyword).
export async function prepareCodeHighlights(
	visiblePerSlide: NodeWithPath[][],
	styles: Styles,
	sceneW: number,
	sceneH: number,
	rowFlexWidths: WeakMap<VNode, RowFlexWidth> = new WeakMap(),
): Promise<WeakMap<VNode, Precomputed>> {
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
			const bold = declarations.bold === 'true'
			const fontSize = parseLength(declarations['font-size'] ?? '', sceneH)
			let width = parseLength(declarations.width ?? '', sceneW)
			const scalePx = fontSize?.px ?? defaultFontPx('code')
			const textScale = pxToTextScale(scalePx)
			const BASELINE_TEXT_SCALE = pxToTextScale(10)
			const widthCompensation = BASELINE_TEXT_SCALE / textScale
			const lineNumbers =
				node.props?.['line-numbers'] === true || node.props?.['line-numbers'] === 'true'
			const sourceLineCount = source.split('\n').length
			const gutterChars = lineNumbers ? Math.max(2, String(sourceLineCount).length) : 0
			// Same shrink-to-fit rule as `layout/element.ts`: when no
			// width is set, use the minimum `line_width` needed to render
			// the longest source line without wrapping.
			if (width === undefined) {
				const minLineWidthPx = computeMinCodeLineWidthPx(source, gutterChars)
				const pxInDefault = minLineWidthPx / widthCompensation
				width = { value: pxInDefault, unit: 'px', px: pxInDefault, meters: pxInDefault / 16 }
			}
			// Row-flex override: when this `<code>` is inside a
			// `grid-auto-flow: row` block and asked for `width: 100%`,
			// `prepareRowFlexWidths` recorded the row-distributed value
			// here so the wrap + tokenization match the smaller cell.
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
			// Same `wrapCodeChars` formula as `code-borders.ts` so the
			// precomputed wrap matches the rendered rows. Code is treated
			// as monospace: every char (including space) counts as 1.
			// Internal overhead is `gutterChars + 5` with line-numbers,
			// `2` without — matches the bordered-row internal layout so
			// the no-gutter case uses all available chars per row instead
			// of leaving 3 chars of slack on the right.
			const maxRowChars = Math.max(10, Math.floor(wrapWidthPx / DEFAULT_MONO_CHAR_PX) - 2)
			const internalOverhead = gutterChars ? gutterChars + 5 : 2
			const maxCodeChars = Math.max(10, maxRowChars - internalOverhead)
			const wrapCodeChars = Math.max(10, maxCodeChars)
			const codeLineWraps = wrapCodeLinesWithOffsets(source, wrapCodeChars)
			// Start offset of each source line in `source`. Line 0 starts
			// at 0; line k+1 starts right after the `\n` that ended line
			// k. Used by the segment splitter to clip segments per line.
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
		// `precomputeHighlights` returns `null` when no grammar is loaded
		// for this lang (e.g. grammar-fetcher auto-fetch failed); in that
		// case the layout falls back to single-color rendering.
		const highlightedPerSourceLine: Array<StyledSegment[] | null> = allSegments
			? splitSegmentsBySourceLine(allSegments, entry.sourceLineStarts, entry.source)
			: entry.sourceLineStarts.map(() => null)
		// `leadingLenPerSourceLine[k]` is the same for every visual row of
		// source line k. Pull it from the first wrap for each source line
		// (the wrap preserves leading whitespace verbatim, so every row of
		// a given source line agrees).
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
// order. A segment that spans a newline boundary is sliced into one
// piece per source line, both retaining the segment's `color`.
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
		// Advance past segments that end before this line.
		while (segIdx < segments.length && cursor + segments[segIdx].text.length <= lineStart) {
			cursor += segments[segIdx].text.length
			segIdx++
		}
		// Slice segments that overlap [lineStart, lineEnd).
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