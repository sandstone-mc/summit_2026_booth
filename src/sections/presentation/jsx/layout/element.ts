// Per-element layout — one ElementLayout per visible JSX element with
// everything the summon pass needs (cell size, scale, margins, content).

import { parseLength, pxToTextScale, pxToTextLineHeight } from '../length'
import { charWidth, wrapLines, wrapCodeLines } from '../text-metrics'
import { DEFAULT_FONT_ID } from '../text-metrics/font-loader'
import type { CssDeclarations } from '../less/types'
import type { VNode, StyledSegment } from '../render'
import type { NodeWithPath } from '../tree/walk'
import type { Styles } from '../style'
import type { Precomputed } from './code-borders'
import { CodeBorders } from './code-borders'
import {
	DEFAULT_CODE_BORDER_COLOR,
	DEFAULT_CODE_LANG_COLOR,
	DEFAULT_IMG_HEIGHT,
	SCROLL_VIEWPORT_BLOCKS,
	defaultFontPx,
} from './constants'
import { parseMarginBox } from './margin'
import { extractCodeSource, extractText } from '../tree/extract'

const codeBorders = new CodeBorders()

// Module-level counter: each scrolling `<code>` element gets a unique
// tag string (`code_scroll_${id}`) so the per-slide scroll-tick can
// target its entity even when several scrolls share one slide.
//
// The counter is shared by both the pre-pass (which builds the
// per-slide scroll specs) and the summon pass (which actually emits
// `summon` commands). Both walks must produce the same tag sequence,
// so `resetScrollIds()` is called between them.
let nextScrollId = 0

/** Reset the scroll-id counter so the next walk starts from `code_scroll_0`. */
export function resetScrollIds(): void {
	nextScrollId = 0
}

type TextElementLayout = {
	kind: 'text'
	node: VNode
	path: string[]
	parentStack: CssDeclarations
	declarations: CssDeclarations
	type: string
	content: string
	borderedContent?: StyledSegment[]
	width: ReturnType<typeof parseLength>
	scalePx: number
	textScale: number
	widthCompensation: number
	cellH: number
	cellW: number
	marginTop: number
	marginBottom: number
	/** True when this `<code>` should auto-scroll its content. */
	scrolling?: boolean
	/** Number of source (pre-wrap) lines — drives the gutter width and scroll distance. */
	sourceLineCount?: number
	/** Unique tag identifying this scrolling block (set when `scrolling`). */
	scrollTag?: string
	/** Total scroll distance in blocks (positive; 0 when content fits). */
	scrollDistBlocks?: number
	/** Visual-line count of the bordered content (used by the scroll math). */
	visualLines?: number
	/** Number of viewport-sized chunks the scrolling block was split into. */
	chunkCount?: number
	/**
	 * Per-chunk bordered content, set when scrolling. The layout pass
	 * treats the scroll block as a SINGLE entity (one cell, one X);
	 * the summon pass creates ONE text_display at that XZ with chunk 0
	 * baked in. The scroll-tick swaps the entity's `text` field for
	 * chunks 1..N-1 via `data modify entity @s text set value [...]`.
	 */
	chunks?: { content: StyledSegment[] }[]
	imgSrc?: undefined
	imgItemModel?: undefined
	imgAspect?: undefined
}

type ImageElementLayout = {
	kind: 'image'
	node: VNode
	path: string[]
	parentStack: CssDeclarations
	declarations: CssDeclarations
	type: string
	content: string
	borderedContent?: undefined
	width: ReturnType<typeof parseLength>
	scalePx: number
	textScale: number
	widthCompensation: number
	cellH: number
	cellW: number
	marginTop: number
	marginBottom: number
	imgSrc: string
	imgItemModel: string
	imgAspect: number
}

export type ElementLayout = TextElementLayout | ImageElementLayout

export type ImgResource = {
	src: string
	aspect: number
	itemModel: string
}
export type ImgResourceMap = Map<string, ImgResource>

// Element-type predicates used across the render + prepare passes.
const TEXT_TYPES = new Set(['h1', 'h2', 'p', 'code'])
const IMG_TYPES = new Set(['img'])

export function isTextType(t: any): boolean {
	return TEXT_TYPES.has(String(t))
}

export function isImgType(t: any): boolean {
	return IMG_TYPES.has(String(t))
}

export function isVisibleType(t: any): boolean {
	return isTextType(t) || isImgType(t)
}

export { TEXT_TYPES, IMG_TYPES }

// Baseline text scale used to compute per-element width compensation.
// Without compensation, an h1 (scale 6) renders ~2.4× wider per default-
// font pixel than a p (scale 2.5) and overflows the cell before MC wraps.
const BASELINE_TEXT_SCALE = pxToTextScale(10)

// Build the layout record for a single visible element. Scrolling
// `<code>` blocks remain a single record (one cell, one X); the
// per-chunk bordered content lives in `layout.chunks` and is fanned
// out into multiple text_display entities by the summon pass.
export function computeElementLayout(
	nodeWithPath: NodeWithPath,
	styles: Styles,
	sceneW: number,
	sceneH: number,
	imgResources: ImgResourceMap,
	codePrecomputed: WeakMap<VNode, Precomputed>,
): ElementLayout {
	const { node, path } = nodeWithPath
	const parentStack =
		path.length === 0 ? ({} as CssDeclarations) : styles.forPathCached(path.slice(0, -1))
	const declarations = styles.forPath(path)
	const type = String(node.type)

	if (type === 'img') {
		return computeImgLayout(node, path, parentStack, declarations, sceneW, sceneH, imgResources)
	}

	return computeTextLayout(node, path, parentStack, declarations, type, sceneW, sceneH, codePrecomputed)
}

function computeImgLayout(
	node: VNode,
	path: string[],
	parentStack: CssDeclarations,
	declarations: CssDeclarations,
	sceneW: number,
	sceneH: number,
	imgResources: ImgResourceMap,
): ElementLayout {
	const src = String(node.props?.src ?? '')
	const resource = imgResources.get(src)
	if (!resource) {
		throw new Error(
			`<img src="${src}"> is missing a registered resource — every src must be prepared via prepareImgResources before render.`,
		)
	}
	// Dimension resolution: `height` prop → LESS `height` → default.
	// Width defaults to height × aspect so the image doesn't distort.
	const heightRaw =
		(typeof node.props?.height === 'string' && node.props.height) ||
		declarations.height ||
		DEFAULT_IMG_HEIGHT
	const widthRaw =
		(typeof node.props?.width === 'string' && node.props.width) || declarations.width || ''
	const heightLen = parseLength(heightRaw, sceneH)
	const explicitWidth = widthRaw ? parseLength(widthRaw, sceneW) : undefined
	const cellH = heightLen?.meters ?? parseLength(DEFAULT_IMG_HEIGHT, sceneH)!.meters
	const cellW = explicitWidth?.meters ?? cellH * resource.aspect
	const { top: marginTop, bottom: marginBottom } = parseMarginBox(declarations, sceneH)
	return {
		kind: 'image',
		node,
		path,
		parentStack,
		declarations,
		type: 'img',
		content: '',
		width: undefined,
		scalePx: 0,
		textScale: 0,
		widthCompensation: 1,
		cellH,
		cellW,
		marginTop,
		marginBottom,
		imgSrc: src,
		imgItemModel: resource.itemModel,
		imgAspect: resource.aspect,
	}
}

function computeTextLayout(
	node: VNode,
	path: string[],
	parentStack: CssDeclarations,
	declarations: CssDeclarations,
	type: string,
	sceneW: number,
	sceneH: number,
	codePrecomputed: WeakMap<VNode, Precomputed>,
): ElementLayout {
	const content = type === 'code' ? extractCodeSource(node.props) : extractText(node.props?.children)

	const fontSize = parseLength(declarations['font-size'] ?? '', sceneH)
	const width = parseLength(declarations.width ?? '', sceneW)

	const scalePx = fontSize?.px ?? defaultFontPx(type)
	const textScale = pxToTextScale(scalePx) // NBT `transformation.scale`

	// `<code>` defaults to monocraft unless LESS overrides.
	const fontId = declarations.font ?? (type === 'code' ? 'monocraft:default' : DEFAULT_FONT_ID)

	const widthCompensation = BASELINE_TEXT_SCALE / textScale

	const heightLen = parseLength(declarations.height ?? '', sceneH)
	const isBold = type === 'h1' || type === 'h2' || declarations.bold === 'true'
	const wrapWidthPx = (width?.px ?? Number.POSITIVE_INFINITY) * widthCompensation

	const codeColor = declarations.color as `#${string}` | undefined
	// `<code>` gets dim border + saturated tag so the box reads as code.
	const borderColor =
		(declarations['border-color'] as `#${string}` | undefined) ??
		(type === 'code' ? DEFAULT_CODE_BORDER_COLOR : codeColor)
	const langColor =
		(declarations['lang-color'] as `#${string}` | undefined) ??
		(type === 'code' ? DEFAULT_CODE_LANG_COLOR : codeColor)
	// `<code line-numbers>` props
	const lineNumbers = type === 'code' && (node.props?.['line-numbers'] === true || node.props?.['line-numbers'] === 'true')
	const gutterColor = (declarations['gutter-color'] as `#${string}` | undefined) ?? '#858585'
	const sourceLineCount = type === 'code' ? content.split('\n').length : 0
	const scrolling = type === 'code' && (node.props?.scrolling === true || node.props?.scrolling === 'true')

	const { top: marginTop, bottom: marginBottom } = parseMarginBox(declarations, sceneH)

	if (type !== 'code') {
		const lines = wrapLines(content, wrapWidthPx, isBold, fontId)
		const lineHeightBlocks = pxToTextLineHeight(scalePx)
		const cellH = heightLen?.meters ?? lineHeightBlocks * lines
		return {
			kind: 'text',
			node,
			path,
			parentStack,
			declarations,
			type,
			content,
			width,
			scalePx,
			textScale,
			widthCompensation,
			cellH,
			cellW: sceneW,
			marginTop,
			marginBottom,
		}
	}

	// `<code>` path. Build the row-by-row bordered output once, then
	// either serialize the full window (non-scroll case) or split into
	// viewport-sized chunks (scroll case).
	const rows = codeBorders.buildRows({
		content,
		language: String(node.props?.lang ?? ''),
		fontId,
		lineWidthPx: wrapWidthPx,
		bold: isBold,
		borderColor,
		langColor,
		codeColor,
		precomputed: codePrecomputed.get(node),
		lineNumbers,
		lineCount: sourceLineCount,
		gutterColor,
	})

	// `lines` (visual row count) = top border + codeRows + bottom border.
	const lines = rows.codeRows.length + 2
	const lineHeightBlocks = pxToTextLineHeight(scalePx)
	const cellH = heightLen?.meters ?? (scrolling ? SCROLL_VIEWPORT_BLOCKS : lineHeightBlocks * lines)
	const totalHeightBlocks = lineHeightBlocks * lines
	const scrollDistBlocks = scrolling ? Math.max(0, totalHeightBlocks - SCROLL_VIEWPORT_BLOCKS) : 0
	const needsScroll = scrolling && scrollDistBlocks > 0

	if (!needsScroll) {
		const codeBordered = codeBorders.serializeWindow(rows, 0, rows.codeRows.length)
		return {
			kind: 'text',
			node,
			path,
			parentStack,
			declarations,
			type,
			content,
			borderedContent: codeBordered,
			width,
			scalePx,
			textScale,
			widthCompensation,
			cellH,
			cellW: sceneW,
			marginTop,
			marginBottom,
		}
	}

	// One chunk per scroll offset — each chunk shows `viewportCodeRows`
	// code rows starting at index `i`. Total chunks = N - V + 1 so the
	// last chunk starts at row N - V and still fits V rows. Every chunk
	// has exactly V code rows, so they all render the same height.
	const viewportCodeRows = Math.max(
		1,
		Math.floor(SCROLL_VIEWPORT_BLOCKS / lineHeightBlocks) - 2,
	)
	const totalCodeRows = rows.codeRows.length
	const chunkCount = Math.max(1, totalCodeRows - viewportCodeRows + 1)
	const scrollTag = `code_scroll_${nextScrollId++}`

	const chunks: { content: StyledSegment[] }[] = []
	for (let i = 0; i < chunkCount; i++) {
		const start = i
		chunks.push({
			content: codeBorders.serializeWindow(rows, start, viewportCodeRows),
		})
	}

	return {
		kind: 'text',
		node,
		path,
		parentStack,
		declarations,
		type,
		content,
		width,
		scalePx,
		textScale,
		widthCompensation,
		cellH,
		cellW: sceneW,
		marginTop,
		marginBottom,
		scrolling: true,
		sourceLineCount,
		scrollTag,
		scrollDistBlocks,
		visualLines: lines,
		chunkCount,
		chunks,
	}
}