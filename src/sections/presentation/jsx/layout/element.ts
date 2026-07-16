// Per-element layout — one ElementLayout per visible JSX element with
// everything the summon pass needs (cell size, scale, margins, content).

import { parseLength, pxToTextScale, pxToTextLineHeight } from '../length'
import { wrapLines } from '../text-metrics'
import { resolveImgSrc } from '../prepare/img-resources'
import { DEFAULT_FONT_ID } from '../text-metrics/font-loader'
import type { CssDeclarations } from '../less/types'
import type { VNode, StyledSegment } from '../render'
import type { NodeWithPath } from '../tree/walk'
import type { Styles } from '../style'
import type { BorderedRows, Precomputed } from './code-borders'
import { CodeBorders, computeMinCodeLineWidthPx } from './code-borders'
import {
	DEFAULT_CODE_BORDER_COLOR,
	DEFAULT_CODE_LANG_COLOR,
	DEFAULT_IMG_HEIGHT,
	getTextDescender,
	defaultFontPx,
} from './constants'
import { parseMarginBox } from './margin'
import { extractCodeSource, extractText } from '../tree/extract'
import type { RowFlexWidth } from '../prepare/row-flex'
import type { ItemModelDefinitionClass } from 'sandstone'

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
	/** Resolved font id (`declarations.font ?? <code>-default rule`). */
	fontId: string
	/**
	 * Set when the caller supplied a `wrap-breaks` prop. The engine has
	 * its own guess for where MC's text_display will wrap given the
	 * element's `line_width`; `wrap-breaks` lets the caller correct
	 * that guess when the engine is wrong. Length 0 means "MC will not
	 * wrap at all" (line count = 1). A non-empty list pins the break
	 * points so the engine's `cellH` math matches what MC actually
	 * renders, even though the actual content / NBT are unchanged.
	 */
	wrapBreaksApplied?: number[]
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
	/** Rows per scroll chunk (set by `finalizeScrollCodeLayout`). */
	viewportCodeRows?: number
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
	/**
	 * Rows from `codeBorders.buildRows` stashed on the element so
	 * `finalizeScrollCodeLayout` can build chunks once the layout
	 * engine has decided the scroll block's `cellH`. Internal —
	 * callers outside `element.ts` should not touch this.
	 */
	__scrollRows?: BorderedRows
	/** `lineHeightBlocks` cached at the same time as `__scrollRows`. */
	__scrollLineHeightBlocks?: number
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
	imgItemModel: ItemModelDefinitionClass
	imgAspect: number
}

export type ElementLayout = TextElementLayout | ImageElementLayout

export type ImgResource = {
	src: string
	aspect: number
	itemModel: ItemModelDefinitionClass
}
export type ImgResourceMap = Map<string, ImgResource>

// Element-type predicates used across the render + prepare passes.
const TEXT_TYPES = new Set(['h1', 'h2', 'h3', 'p', 'code', 'explorer'])
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
	rowFlexWidths: WeakMap<VNode, RowFlexWidth> = new WeakMap(),
	explorerPrecomputed: WeakMap<VNode, Precomputed> = new WeakMap(),
): ElementLayout {
	const { node, path } = nodeWithPath
	const parentStack =
		path.length === 0 ? ({} as CssDeclarations) : styles.forPathCached(path.slice(0, -1))
	const declarations = styles.forPath(path)
	const type = String(node.type)

	if (type === 'img') {
		return computeImgLayout(node, path, parentStack, declarations, sceneW, sceneH, imgResources)
	}

	return computeTextLayout(node, path, parentStack, declarations, type, sceneW, sceneH, codePrecomputed, rowFlexWidths, explorerPrecomputed)
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
	const src = resolveImgSrc(node.props?.src)
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

// Find the longest line (by char count) in a text source. Used for
// `width: fit-content` resolution on prose elements.
function longestLineCharCount(content: string): number {
	let best = 0
	for (const line of content.split('\n')) {
		if (line.length > best) best = line.length
	}
	return best
}

// Parse the `wrap-breaks` JSX prop. Accepts an array of non-negative
// integers (word indices). Returns `undefined` when the prop is
// omitted so the existing auto-wrap pipeline runs. Returns `[]` when
// the caller explicitly wants no wrapping.
function parseWrapBreaks(raw: unknown): number[] | undefined {
	if (raw === undefined || raw === null) return undefined
	if (!Array.isArray(raw)) return []
	const out: number[] = []
	for (const v of raw) {
		const n = typeof v === 'number' ? v : Number(v)
		if (Number.isInteger(n) && n >= 0) out.push(n)
	}
	return out
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
	rowFlexWidths: WeakMap<VNode, RowFlexWidth>,
	explorerPrecomputed: WeakMap<VNode, Precomputed>,
): ElementLayout {
	const isCode = type === 'code'
	const isExplorer = type === 'explorer'
	const content = isCode
		? extractCodeSource(node.props)
		: isExplorer
			? extractExplorerSource(node, explorerPrecomputed)
			: extractText(node.props?.children)

	const fontSize = parseLength(declarations['font-size'] ?? '', sceneH)

	const scalePx = fontSize?.px ?? defaultFontPx(type)
	const textScale = pxToTextScale(scalePx) // NBT `transformation.scale`

	// `<code>` / `<explorer>` default to sandstone_summit_booth:monospace unless LESS overrides.
	const fontId = declarations.font ?? (isCode || isExplorer ? 'sandstone_summit_booth:monospace' : DEFAULT_FONT_ID)

	const widthCompensation = BASELINE_TEXT_SCALE / textScale

	const heightLen = parseLength(declarations.height ?? '', sceneH)
	const isBold = type === 'h1' || type === 'h2' || declarations.bold === 'true'
	// `<code>` line-numbers props
	const lineNumbers = isCode && (node.props?.['line-numbers'] === true || node.props?.['line-numbers'] === 'true')
	const sourceLineCount = (isCode || isExplorer) ? content.split('\n').length : 0
	const gutterChars = lineNumbers ? Math.max(2, String(sourceLineCount).length) : 0
	const scrolling =
		(isCode || isExplorer) &&
		(node.props?.scrolling === true || node.props?.scrolling === 'true')

	// `<code>` / `<explorer>` with no explicit width: shrink to the minimum
	// needed to render the longest source line without wrapping. The
	// `computeMinCodeLineWidthPx` math is shared because both elements use
	// the same monospace wrap + bordered layout.
	//
	// Width resolution order (matches `<img>`'s `widthRaw`):
	//   1. JSX `width` prop (explicit user intent)
	//   2. LESS `width` declaration
	//   3. shrink-to-fit for `<code>` / `<explorer>`
	const widthRaw =
		(typeof node.props?.width === 'string' && node.props.width) ||
		declarations.width ||
		''
	let width = parseLength(widthRaw, sceneW)
	// `fit-content` for `<code>` / `<explorer>`: shrink to the natural
	// width (the minimum that renders the longest source line without
	// wrapping). `parseLength` returns a `meters: 0` placeholder for
	// `fit-content`, so we replace it with the same shrink-to-fit value
	// the `width === undefined` fallback computes. Without this, the
	// wrap budget reads `width.px === 0` and collapses to 10 chars per
	// row, making the box render unnaturally narrow.
	if ((isCode || isExplorer) && (width === undefined || width.unit === 'fit-content')) {
		const minLineWidthPx = computeMinCodeLineWidthPx(content, gutterChars)
		const pxInDefault = minLineWidthPx / widthCompensation
		width = { value: pxInDefault, unit: 'px', px: pxInDefault, meters: pxInDefault / 16 }
	}
	// Row-flex override: when this element is inside a `grid-auto-flow:
	// row` block and asked for `width: 100%`, `prepareRowFlexWidths`
	// already computed the row-distributed value. Override the parsed
	// width so cellW + border build use the smaller constraint.
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
	// `<code>` / `<explorer>` get dim border + saturated tag so the box
	// reads as a code-style panel. The lang slot's "explorer" tag uses
	// the same teal as `<code>`'s lang tag for visual consistency.
	const borderColor =
		(declarations['border-color'] as `#${string}` | undefined) ??
		((isCode || isExplorer) ? DEFAULT_CODE_BORDER_COLOR : codeColor)
	const langColor =
		(declarations['lang-color'] as `#${string}` | undefined) ??
		(isCode || isExplorer ? DEFAULT_CODE_LANG_COLOR : codeColor)
	const gutterColor = (declarations['gutter-color'] as `#${string}` | undefined) ?? '#858585'

	const { top: marginTop, bottom: marginBottom } = parseMarginBox(declarations, sceneH)

	if (!isCode && !isExplorer) {
		// `wrap-breaks` is a caller-supplied override for the engine's
		// line-count prediction. Each entry is a global word index
		// (whitespace-delimited, matching `wrapToLines`'s definition);
		// word N begins a new line. Empty array = "MC doesn't wrap
		// this at all" (line count = 1). Undefined keeps the engine's
		// `wrapLines()` guess. The content string passed to MC is
		// unchanged either way — only `cellH` is corrected.
		const wrapBreaks = parseWrapBreaks(node.props?.['wrap-breaks'])
		let lines: number
		let wrapBreaksApplied: number[] | undefined
		if (wrapBreaks !== undefined) {
			wrapBreaksApplied = wrapBreaks
			lines = wrapBreaks.length === 0 ? 1 : wrapBreaks.length + 1
		} else {
			lines = wrapLines(content, wrapWidthPx, isBold, fontId)
		}
		const lineHeightBlocks = pxToTextLineHeight(scalePx, fontId)
		// `width: fit-content` (prose): resolve to the longest visual
		// line's char count × MC's default-font char width (~7 px per char
		// in default scale, conservative vs the literal 6 px to absorb
		// wider glyphs like 'd', 'm', 'w'). Cap at slide width.
		if (width?.unit === 'fit-content') {
			const longestChars = longestLineCharCount(content)
			const charWidthBlocks = (7 / 16) * textScale
			const naturalWidthBlocks = Math.min(sceneW, longestChars * charWidthBlocks)
			width = {
				value: naturalWidthBlocks * 16,
				unit: 'px',
				px: naturalWidthBlocks * 16,
				meters: naturalWidthBlocks,
			}
		}
		const cellH = heightLen?.meters ?? lineHeightBlocks * lines
		// cellW respects explicit LESS width (incl. `fit-content`,
		// resolved just above) — the default is the slide width.
		const cellW = width?.meters ?? sceneW
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
			cellW,
			marginTop,
			marginBottom,
			fontId,
			wrapBreaksApplied,
		}
	}

	// `<code>` / `<explorer>` path. Build the row-by-row bordered output
	// once, then either serialize the full window (non-scroll case) or
	// split into viewport-sized chunks (scroll case). The two elements
	// share the bordered layout because their visual shape is identical;
	// the only differences are (a) where the source string comes from
	// (already extracted into `content` above) and (b) the precomputed
	// map that carries per-source-line color segments. `<code>` gets its
	// segments from the syntax-highlight pass; `<explorer>` gets them
	// from the tree-walk pass that paints folders vs files.
	const precomputed = isExplorer ? explorerPrecomputed.get(node) : codePrecomputed.get(node)
	// `<explorer>`'s top-border lang tag is just the word "explorer" so
	// the box reads as an explorer panel instead of an unnamed code box.
	// `<code>` uses its `lang` prop (or empty if unset).
	const language = isExplorer ? 'explorer' : String(node.props?.lang ?? '')
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
	})

	// `lines` (visual row count) = top border + codeRows + bottom border.
	const lines = rows.codeRows.length + 2
	const lineHeightBlocks = pxToTextLineHeight(scalePx, fontId)

	// Non-scroll path: cellH is the bordered content height; serialize
	// the full window once and return.
	if (!scrolling) {
		const cellH = heightLen?.meters ?? lineHeightBlocks * lines
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
			cellW: width?.meters ?? sceneW,
			marginTop,
			marginBottom,
			fontId,
		}
	}

	// Scroll path: defer cellH + chunk math to `finalizeScrollCodeLayout`.
	// The layout engine decides cellH from the slide's remaining space
	// after non-scroll elements are placed, then calls finalize so each
	// chunk's viewport row count fits the actual cellH. Until then, stash
	// the bordered rows + line height so finalize can rebuild chunks.
	// `heightLen` is intentionally ignored here — for scroll blocks, cellH
	// is layout-driven; any LESS `height` on the code element (or
	// cascading in from a parent like `#code-grid { height: 100% }`)
	// would lock the block at the wrong size and make the layout engine's
	// "fill remaining space" math collapse.
	const scrollTag = `code_scroll_${nextScrollId++}`
	const placeholderCellH = 0

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
		cellH: placeholderCellH,
		cellW: width?.meters ?? sceneW,
		marginTop,
		marginBottom,
		fontId,
		scrolling: true,
		sourceLineCount,
		scrollTag,
		scrollDistBlocks: 0,
		visualLines: lines,
		chunkCount: 0,
		chunks: [],
		__scrollRows: rows,
		__scrollLineHeightBlocks: lineHeightBlocks,
	}
}

/**
 * Build chunks for a scrolling `<code>` element once the layout engine
 * has set its `cellH`. Reserves 2 lines inside the chunk for its own
 * top + bottom border, plus font-derived descender slack below the
 * cell (without this, descender-bearing characters spill off-screen
 * on the chunk's first line). The rest becomes `viewportCodeRows` of
 * code. Mutates the element in place. No-op for non-scroll or non-text.
 */
export function finalizeScrollCodeLayout(el: ElementLayout): void {
	if (el.kind !== 'text' || !el.scrolling) return
	const rows = el.__scrollRows
	const lineHeightBlocks = el.__scrollLineHeightBlocks ?? 0
	if (!rows || lineHeightBlocks <= 0) return

	const cellH = el.cellH
	const textDescender = getTextDescender(el.fontId, el.scalePx)
	// Subtracted from cellH: default-font descender + 2 line heights
	// (top + bottom border rows of this chunk).
	const codeAreaBlocks = Math.max(0, cellH - textDescender - 2 * lineHeightBlocks)
	const viewportCodeRows = Math.max(1, Math.floor(codeAreaBlocks / lineHeightBlocks))
	const totalCodeRows = rows.codeRows.length
	const chunkCount = Math.max(1, totalCodeRows - viewportCodeRows + 1)

	const chunks: { content: StyledSegment[] }[] = []
	for (let i = 0; i < chunkCount; i++) {
		chunks.push({
			content: codeBorders.serializeWindow(rows, i, viewportCodeRows),
		})
	}

	// Total height the bordered content would occupy if fully shown.
	const totalHeightBlocks = lineHeightBlocks * (totalCodeRows + 2)
	el.viewportCodeRows = viewportCodeRows
	el.chunkCount = chunkCount
	el.chunks = chunks
	el.scrollDistBlocks = Math.max(0, totalHeightBlocks - cellH)
}

// Resolve the source string for a `<explorer>` element. The tree was
// already walked + indented at build time by `prepareExplorerTrees`;
// `Precomputed.source` carries the raw `\n`-joined lines so the layout
// pass can use the same wrap math `<code>` uses. Falls back to empty
// string when the prepare pass didn't produce a precomputed entry
// (e.g., the explorer was filtered out before layout).
function extractExplorerSource(
	node: VNode,
	explorerPrecomputed: WeakMap<VNode, Precomputed>,
): string {
	const pre = explorerPrecomputed.get(node)
	return pre?.source ?? ''
}