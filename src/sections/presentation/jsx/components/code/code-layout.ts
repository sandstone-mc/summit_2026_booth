// Code layout — computeCodeLayout + CodeLayout type +
// finalizeScrollCodeLayout. Heavy logic lives here; the component
// class delegates.

import { parseLength, pxToTextLineHeight, pxToTextScale } from '../../length'
import { extractCodeSource } from '../../tree/extract'
import { CodeBorders, computeMinCodeLineWidthPx, type Precomputed } from './code-borders'
import { getTextDescender } from '../../layout/constants'
import { parseMarginBox } from '../../layout/margin'
import type { VNode, StyledSegment } from '../../render'
import type { CssDeclarations } from '../../less/types'
import type { Styles } from '../../style'
import type { NodeWithPath } from '../../tree/walk'
import { type ComponentLayoutBase } from '../base'
import { parseSidePadding } from '../summon-helpers'
import { RowFlexWidth } from '../../layout/row-flex';
import { Label } from 'sandstone';

// Default `<code>` border + language-tag colors. Picked up when
// the caller didn't set their own, so even unset `<code>` blocks
// read as code boxes instead of collapsing into the code color.
const DEFAULT_CODE_BORDER_COLOR = '#6a6a6a' as const
const DEFAULT_CODE_LANG_COLOR = '#4ec9b0' as const

// Default scale (in font-pixel units) for `<code>` blocks when
// LESS doesn't specify `font-size`. 8 px → readable monospace at
// scale 1.
const CODE_DEFAULT_SCALE_PX = 8

const codeBorders = new CodeBorders()

// Module-level counter: each scrolling `<code>` block gets a unique
// `code_scroll_<n>` tag. Pre-pass + summon pass share the counter via
// `resetScrollIds()`.
// TODO: This is bad, use componentIdx
let nextScrollId = 0
export function resetScrollIds(): void {
	nextScrollId = 0
}

// Layout shape for `<code>`. Same fields as the original
// TextElementLayout for text + code-specific extras.
export type CodeLayout = ComponentLayoutBase & {
	kind: 'text'
	content: string
	borderedContent?: StyledSegment[]
	styleWidth: ReturnType<typeof parseLength>
	scalePx: number
	textScale: number
	widthCompensation: number
	fontId: string
	scrolling?: boolean
	sourceLineCount?: number
	scrollTag?: string
	scrollDistBlocks?: number
	visualLines?: number
	viewportCodeRows?: number
	chunkCount?: number
	chunks?: { content: StyledSegment[] }[]
	/** Ticks per chunk (frame-skip framerate). Default 4. */
	ticksPerChunk?: number
	__scrollRows?: ReturnType<CodeBorders['buildRows']>
	__scrollLineHeightBlocks?: number
}

export function computeCodeLayout(
	node: VNode,
	path: string[],
	parentStack: CssDeclarations,
	declarations: CssDeclarations,
	sceneW: number,
	sceneH: number,
	codePrecomputed: WeakMap<VNode, Precomputed>,
	rowFlexWidths: WeakMap<VNode, RowFlexWidth>,
): CodeLayout {
	const content = extractCodeSource(node.props)
	const fontSize = parseLength(declarations['font-size'] ?? '', sceneH)
	const scalePx = fontSize?.px ?? CODE_DEFAULT_SCALE_PX
	const textScale = pxToTextScale(scalePx)
	const BASELINE_TEXT_SCALE = pxToTextScale(10)
	const widthCompensation = BASELINE_TEXT_SCALE / textScale
	const fontId = declarations.font ?? 'sandstone_summit_booth:monospace'

	const widthRaw =
		(typeof node.props?.width === 'string' && node.props.width) ||
		declarations.width ||
		''
	let width = parseLength(widthRaw, sceneW)
	const lineNumbers =
		node.props?.['line-numbers'] === true || node.props?.['line-numbers'] === 'true'
	const sourceLineCount = content.split('\n').length
	const gutterChars = lineNumbers ? Math.max(2, String(sourceLineCount).length) : 0
	const scrolling =
		node.props?.scrolling === true || node.props?.scrolling === 'true'
	const ticksPerChunkProp = Number(node.props?.['ticks-per-chunk'])
	const ticksPerChunk = Number.isFinite(ticksPerChunkProp) && ticksPerChunkProp > 0
		? Math.floor(ticksPerChunkProp)
		: 4

	if (width === undefined || width.unit === 'fit-content') {
		const minLineWidthPx = computeMinCodeLineWidthPx(content, gutterChars)
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

	const codeColor = declarations.color as `#${string}` | undefined
	const borderColor =
		(declarations['border-color'] as `#${string}` | undefined) ??
		DEFAULT_CODE_BORDER_COLOR
	const langColor =
		(declarations['lang-color'] as `#${string}` | undefined) ??
		DEFAULT_CODE_LANG_COLOR
	const gutterColor = (declarations['gutter-color'] as `#${string}` | undefined) ?? '#858585'
	const isBold = declarations.bold === 'true'
	const { top: marginTop, bottom: marginBottom } = parseMarginBox(declarations, sceneH)

	const precomputed = codePrecomputed.get(node)
	const language = String(node.props?.lang ?? '')
	const sidePadding = parseSidePadding(node.props?.['side-padding'])
	const rows = codeBorders.buildRows({
		content,
		language,
		fontId,
		lineWidthPx: wrapWidthPx,
		bold: isBold,
		borderColor,
		langColor,
		codeColor,
		precomputed,
		lineNumbers,
		lineCount: sourceLineCount,
		gutterColor,
		sidePadding,
	})
	const lines = rows.codeRows.length + 2
	const lineHeightBlocks = pxToTextLineHeight(scalePx, fontId)
	const heightLen = parseLength(declarations.height ?? '', sceneH)

	if (!scrolling) {
		const cellH = heightLen?.meters ?? lineHeightBlocks * lines
		const codeBordered = codeBorders.serializeWindow(rows, 0, rows.codeRows.length)
		return {
			kind: 'text',
			node, path, parentStack, declarations, type: 'code',
			content,
			borderedContent: codeBordered,
			styleWidth: width,
			scalePx, textScale, widthCompensation,
			fontId, cellH,
			cellW: width?.meters ?? sceneW,
			marginTop, marginBottom,
		}
	}

	const scrollTag = `${Label(`code_scroll_${nextScrollId++}`)}`
	const placeholderCellH = 0
	return {
		kind: 'text',
		node, path, parentStack, declarations, type: 'code',
		content,
		styleWidth: width,
		scalePx, textScale, widthCompensation,
		fontId,
		cellH: placeholderCellH,
		cellW: width?.meters ?? sceneW,
		marginTop, marginBottom,
		scrolling: true,
		sourceLineCount,
		scrollTag,
		scrollDistBlocks: 0,
		visualLines: lines,
		chunkCount: 0,
		chunks: [],
		ticksPerChunk,
		__scrollRows: rows,
		__scrollLineHeightBlocks: lineHeightBlocks,
	}
}

// Build chunks for a scrolling `<code>` element once the layout
// engine has set its `cellH`. Reserves 2 lines inside the chunk for
// its own top + bottom border plus font-derived descender slack
// below the cell (descenders would otherwise spill off-screen on
// the chunk's first line).
export function finalizeScrollCodeLayout(el: CodeLayout): void {
	if (!el.scrolling) return
	const rows = el.__scrollRows
	const lineHeightBlocks = el.__scrollLineHeightBlocks ?? 0
	if (!rows || lineHeightBlocks <= 0) return
	const cellH = el.cellH
	const textDescender = getTextDescender(el.fontId, el.scalePx)
	const codeAreaBlocks = Math.max(0, cellH - textDescender - 2 * lineHeightBlocks)
	const viewportCodeRows = Math.max(1, Math.floor(codeAreaBlocks / lineHeightBlocks))
	const totalCodeRows = rows.codeRows.length
	const chunkCount = Math.max(1, totalCodeRows - viewportCodeRows + 1)
	const chunks: { content: StyledSegment[] }[] = []
	for (let i = 0; i < chunkCount; i++) {
		chunks.push({ content: codeBorders.serializeWindow(rows, i, viewportCodeRows) })
	}
	const totalHeightBlocks = lineHeightBlocks * (totalCodeRows + 2)
	el.viewportCodeRows = viewportCodeRows
	el.chunkCount = chunkCount
	el.chunks = chunks
	el.scrollDistBlocks = Math.max(0, totalHeightBlocks - cellH)
}

export function codeLayoutFor(
	nw: NodeWithPath,
	styles: Styles,
	sceneW: number,
	sceneH: number,
	codePrecomputed: WeakMap<VNode, Precomputed>,
	rowFlexWidths: WeakMap<VNode, RowFlexWidth>,
): CodeLayout {
	const { node, path } = nw
	const parentStack =
		path.length === 0 ? ({} as CssDeclarations) : styles.forPathCached(path.slice(0, -1))
	const declarations = styles.forPath(path)
	return computeCodeLayout(node, path, parentStack, declarations, sceneW, sceneH, codePrecomputed, rowFlexWidths)
}