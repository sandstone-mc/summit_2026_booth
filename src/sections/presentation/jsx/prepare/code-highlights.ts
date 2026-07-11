// Pre-compute `<code>` block highlights BEFORE the synchronous layout
// pass. Each VNode gets a `Precomputed` entry containing the wrapped
// line list + tree-sitter styled segments, so the layout pass can
// look them up without re-wrapping or re-parsing.

import { charWidth, wrapCodeLinesAsArray } from '../text-metrics'
import { parseLength, pxToTextScale } from '../length'
import type { Styles } from '../style'
import type { VNode, StyledSegment } from '../render'
import type { NodeWithPath } from '../tree/walk'
import { extractCodeSource } from '../tree/extract'
import { defaultFontPx } from '../layout/constants'
import type { Precomputed } from '../layout/code-borders'
import { precomputeHighlights } from '../highlight'
import { GRAMMARS } from '../layout/constants'

// Why pre-tokenize the *joined wrapped content* (not the raw source):
// `wrapCodeLinesAsArray` strips `\n` separators between wrapped lines,
// so character offsets in the wrapped output don't line up with offsets
// in the original source. Re-tokenizing the wrapped version means each
// segment's `[start..end)` falls cleanly inside a single wrapped line.
export async function prepareCodeHighlights(
	visiblePerSlide: NodeWithPath[][],
	styles: Styles,
	sceneW: number,
	sceneH: number,
): Promise<WeakMap<VNode, Precomputed>> {
	const map: WeakMap<VNode, Precomputed> = new WeakMap()

	type Entry = { node: VNode; source: string; lang: string; codeLines: string[] }
	const entries: Entry[] = []
	for (const visible of visiblePerSlide) {
		for (const { node, path } of visible) {
			if (node.type !== 'code') continue
			const lang = String(node.props?.lang ?? '')
			if (!lang) continue
			const source = extractCodeSource(node.props)
			if (!source) continue
			const declarations = styles.forPath(path)
			const fontId = declarations.font ?? 'monocraft:default'
			const bold = declarations.bold === 'true'
			const fontSize = parseLength(declarations['font-size'] ?? '', sceneH)
			const width = parseLength(declarations.width ?? '', sceneW)
			const scalePx = fontSize?.px ?? defaultFontPx('code')
			const textScale = pxToTextScale(scalePx)
			const BASELINE_TEXT_SCALE = pxToTextScale(10)
			const widthCompensation = BASELINE_TEXT_SCALE / textScale
			const wrapWidthPx = (width?.px ?? Number.POSITIVE_INFINITY) * widthCompensation
			const barW = charWidth('│', false, fontId)
			const innerWidth = Math.max(50, wrapWidthPx - 2 * barW)
			const codeLines = wrapCodeLinesAsArray(source, innerWidth, bold, fontId)
			entries.push({ node, source: codeLines.join('\n'), lang, codeLines })
		}
	}

	const lookup = await precomputeHighlights(GRAMMARS, entries.map((e) => ({ source: e.source, lang: e.lang })))

	for (const entry of entries) {
		const highlighted = lookup(entry.source, entry.lang) as StyledSegment[] | null
		map.set(entry.node, { codeLines: entry.codeLines, highlighted })
	}
	return map
}