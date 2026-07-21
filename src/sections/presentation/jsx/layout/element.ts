// Per-element layout — one ElementLayout per visible JSX element with
// everything the summon pass needs (cell size, scale, margins, content).

import { parseLength, pxToTextScale, pxToTextLineHeight } from '../length'
import { wrapLines, wrapSegmentedLines, textWidth, charWidth } from '../text-metrics'
import { resolveImgSrc } from '../prepare/img-resources'
import { DEFAULT_FONT_ID } from '../text-metrics/font-loader'
import type { CssDeclarations } from '../less/types'
import type { VNode, StyledSegment } from '../render'
import type { NodeWithPath } from '../tree/walk'
import type { Styles } from '../style'
import type { BorderedRows, Precomputed } from './code-borders'
import { CodeBorders, computeMinCodeLineWidthPx, DEFAULT_MONO_CHAR_PX } from './code-borders'
import { parseColorInt } from './color'
import {
	DEFAULT_CODE_BORDER_COLOR,
	DEFAULT_CODE_LANG_COLOR,
	DEFAULT_IMG_HEIGHT,
	getTextDescender,
	defaultFontPx,
} from './constants'
import { parseMarginBox } from './margin'
import {
	DEFAULT_INLINE_CODE_BG,
	DEFAULT_INLINE_CODE_COLOR,
	extractCodeSource,
	extractText,
	parseInlineFormatting,
} from '../tree/extract'
import type { RowFlexWidth } from '../prepare/row-flex'
import { summon, type ItemModelDefinitionClass } from 'sandstone'

const codeBorders = new CodeBorders()

// Parse the `side-padding` JSX prop. Accepts a `[left, right]` tuple
// or a single number (applied to both sides). Returns the default
// `[1, 1]` when the prop is missing or malformed.
function parseSidePadding(raw: unknown): [number, number] {
	if (Array.isArray(raw) && raw.length >= 2) {
		const l = Number(raw[0])
		const r = Number(raw[1])
		if (Number.isFinite(l) && Number.isFinite(r)) return [l, r]
	}
	if (typeof raw === 'number' && Number.isFinite(raw)) return [raw, raw]
	return [1, 1]
}

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

// Module-level counter for `<autocomplete>` elements. Each gets an `ac_<n>`
// suffix on its per-role tags (`ac_editor_<n>`, `ac_cursor_<n>`,
// `ac_popup_<n>`) so the per-slide tick MCFunction can target each
// role's entity uniquely. Same sharing rule as `nextScrollId` — the
// pre-pass and the summon pass must agree, so `resetAutocompleteIds()`
// runs between them.
let nextAutocompleteId = 0

/** Reset the autocomplete-id counter so the next walk starts from `ac_0`. */
export function resetAutocompleteIds(): void {
	nextAutocompleteId = 0
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
	/**
	 * HACK (`extra-row` JSX prop). When true, the scroll viewport shows
	 * 1 additional code row and the entity is shifted up by 1 line
	 * height. Used to fix per-slide layout tightness without changing
	 * the general layout engine. Mutated in-place by the summon pass
	 * (entityY shift) and `finalizeScrollCodeLayout` (chunk count).
	 */
	extraRow?: boolean
	/**
	 * HACK (`shift-up` JSX prop). Positive value shifts the element's
	 * rendered Y up by N blocks. Applied at placement time in
	 * `layout/index.ts`. Stored as a number on the layout; ignored for
	 * scroll `<code>` blocks (which have their own `extraRow` knob).
	 */
	shiftUp?: number
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
	/**
	 * Inline-formatted prose segments for `<p>` / `<h*>` — a flat
	 * `StyledSegment[]` already in source order. Set when the
	 * element's text contains `**bold**` / `*italic*` / `` `code` ``
	 * markers. The summon pass hands this array directly to MC's
	 * `text` field — Minecraft's `text_display.line_width` does the
	 * actual wrap at runtime; we never inject `\n` characters.
	 */
	styledContent?: StyledSegment[]
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

/**
 * Animated autocomplete demo. One JSX `<autocomplete>` element expands
 * into three text_display entities (editor, cursor, popup) at the same
 * XZ. The `stages[]` array describes what each of the three entities
 * renders at every typing stage; the per-slide tick MCFunction
 * (`presentation/slides/autocomplete/<idx>`) drives all three per stage.
 */
type AutocompleteElementLayout = {
	kind: 'autocomplete'
	node: VNode
	path: string[]
	parentStack: CssDeclarations
	declarations: CssDeclarations
	type: 'autocomplete'
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
	fontId: string
	/** Stable identifier suffixed onto per-role tags (`ac_<n>`). */
	autoId: string
	/** Total number of typing stages. tick uses `stage = clamp(elapsed/ticksPerStage, 0, stageCount-1)`. */
	stageCount: number
	/** Per-stage state for editor + cursor + popup. Index = stage. */
	stages: {
		/** Bordered editor text at this stage (code-progressed-to-here). */
		editorContent: StyledSegment[]
		/** Cursor X offset in blocks from the editor's left edge. */
		cursorXBlocks: number
		/** Cursor Y offset in blocks from the editor's entity position. */
		cursorYBlocks: number
		/** Whether the IntelliSense popup is visible at this stage. */
		popupVisible: boolean
		/** Per-segment popup text at this stage — outer index = segment
		 * index (0 = SELECTED / top segment, 1+ = the rest), inner =
		 * segments for that segment. Each segment's rows are joined with
		 * `\n` segments so a single text_display entity can render
		 * multiple consecutive rows of the same bg color. Empty when the
		 * popup isn't visible at this stage. */
		popupSegmentContent: StyledSegment[][]
		/** Index of the highlighted entry in the popup. -1 = none. */
		popupHighlightIdx: number
	}[]
	/** Cursor blink period in ticks (default 5). The tick toggles every `cursorBlink` ticks. */
	cursorBlink: number
	/** Number of source lines in the snippet the autocomplete is typing
	 * out. The tick uses this to compute the popup's Y offset relative
	 * to the cursor (instead of a hardcoded half-line nudge). */
	sourceLineCount: number
	/** Per-stage popup trigger column, in BLOCKS from the editor anchor X.
	 * Computed from the typed slice's column count as the cursor's visual
	 * center at the end of the typed text on the current line:
	 *   = paddingLeftBlocks + colChars * charWidthBlocks + charWidthBlocks/2
	 * This is the column where the popup would appear IF the cursor's
	 * visual position were derived purely from the typed-text-end column
	 * (the principled math, ignoring the -12 hack in the live cursor X
	 * formula). Tracked per stage so future revisions of the cursor/popup
	 * formulas can target the right value without re-deriving from the
	 * typed slice every time. The live `cursorXPerStage` is left at the
	 * current empirically-tuned formula (with the -12 hack). */
	popupTriggerColumnBlocks: number[]
	/** Width in px of the popup's `line_width` PER STAGE (index = stage).
	 * Different moments (entity-ID vs NBT-key) have different content
	 * lengths, so their `line_width` differs. 0 when the popup is hidden. */
	popupWidthPxPerStage: number[]
	/** Popup broken into consecutive bg-color RUNS — consecutive rows that
	 * share the same background become a single text_display entity (so
	 * e.g. a 4-row popup with `[blue, gray, gray, gray]` becomes 2
	 * entities: one 1-line blue + one 3-line gray). Each entry's
	 * `offsetYBlocks` is the static Y offset (in blocks, in the editor's
	 * local "down = positive" coord system) from the per-stage popup
	 * anchor Y to position this segment's text rows at the right vertical
	 * spot within the popup. `heightBlocks` is the segment's rendered
	 * height in blocks (one or more rows of `popupLineHeightBlocks`). */
	popupSegments: {
		bgInt: number
		startRow: number
		endRow: number
		heightBlocks: number
		offsetYBlocks: number
	}[]
	/** Cursor color hex string. */
	cursorColor: `#${string}`
	/** Cursor glyph width in blocks (used to anchor popup left at cursor right). */
	cursorWidthBlocks: number
	/** Cursor glyph height in blocks (used to anchor popup top at cursor top). */
	cursorHeightBlocks: number
	/** Per-row line height in blocks at the popup's font/scale. Used by
	 * the tick to compute each row's Y offset from the popup anchor. */
	popupLineHeightBlocks: number
	/** Popup total height in blocks (rows only — no border rows). */
	popupHeightBlocks: number
	/** Whether each IntelliSense moment is enabled. */
	entityStageStart: number
	nbtStageStart: number
}

export type ElementLayout = TextElementLayout | ImageElementLayout | AutocompleteElementLayout

export type ImgResource = {
	src: string
	aspect: number
	itemModel: ItemModelDefinitionClass
}
export type ImgResourceMap = Map<string, ImgResource>

// Element-type predicates used across the render + prepare passes.
// `<autocomplete>` is treated as text-shaped (it is text_content even
// though it expands into three entities). Keeps `isVisibleType` returning
// true and avoids breaking `groupIntoBlocks` — it falls through as a
// single-element block.
const TEXT_TYPES = new Set(['h1', 'h2', 'h3', 'p', 'code', 'explorer', 'autocomplete'])
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

	if (type === 'autocomplete') {
		return computeAutocompleteLayout(
			node,
			path,
			parentStack,
			declarations,
			sceneW,
			sceneH,
			codePrecomputed,
		)
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
	// HACK: `extra-row` prop. Bumps scroll viewport by 1 row + shifts
	// entity up by 1 line. Applied in finalizeScrollCodeLayout + the
	// placement pass in layout/index.ts. Scrolling-only — ignored for
	// non-scroll `<code>` / `<explorer>`.
	const extraRow =
		isCode && (node.props?.['extra-row'] === true || node.props?.['extra-row'] === 'true')

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
		// Inline-formatting detection. Parse `**bold**`, `*italic*`, and
		// `` `code` `` markers out of `content`. When markers produce a
		// styled segment array, the wrap uses the segment-aware path so
		// monospace spans are measured against the monospace font and
		// the cellH reflects the segment-aware line count.
		//
		// LESS knobs `inline-code-color` / `inline-code-bg` override the
		// gray default for inline `` `code` `` spans. `inline-code-bg` is
		// stored only — MC text components have no per-segment background
		// field; see `nbt.ts` and `summon-entity.ts` for the deferred
		// per-segment rendering.
		const inlineCodeColor =
			(declarations['inline-code-color'] as `#${string}` | undefined) ??
			DEFAULT_INLINE_CODE_COLOR
		const inlineCodeBg =
			(declarations['inline-code-bg'] as `#${string}` | undefined) ??
			DEFAULT_INLINE_CODE_BG
		const parsedSegments = parseInlineFormatting(content, inlineCodeColor, inlineCodeBg)
		const isFormatted = parsedSegments.some(
			(s) => s.bold || s.italic || s.font || s.color || s.background,
		)

		// `wrap-breaks` is a caller-supplied hint for the engine's
		// line-count prediction. Each entry is a global word index
		// (whitespace-delimited, matching `wrapToLines`'s definition);
		// word N begins a new line. Empty array = "MC doesn't wrap
		// this at all" (line count = 1). Undefined keeps the engine's
		// `wrapLines()` guess.
		//
		// NOTE: `wrap-breaks` is purely an INSTRUCTION-to-ENGINE — it
		// tells the layout pass where MC will actually break given
		// the element's `line_width`, so `cellH` can match. The text
		// content itself is left unchanged: MC's runtime wrap decides
		// actual break points. We do NOT inject `\n` characters into
		// the rendered text.
		const wrapBreaks = parseWrapBreaks(node.props?.['wrap-breaks'])
		let lines: number
		let wrapBreaksApplied: number[] | undefined
		let styledContent: StyledSegment[] | undefined
		if (isFormatted) {
			// Hand MC the flat segment array verbatim. Minecraft's
			// text_display wraps at runtime based on `line_width`, so
			// the segments stay in source order without `\n` separators.
			styledContent = parsedSegments
			// Use the segment-aware wrap purely as a line-COUNT guess
			// for cellH. When the caller supplied `wrap-breaks`, trust
			// it instead — it's the engine's view of where MC will
			// actually break at runtime.
			if (wrapBreaks !== undefined) {
				wrapBreaksApplied = wrapBreaks
				lines = wrapBreaks.length === 0 ? 1 : wrapBreaks.length + 1
			} else {
				lines = wrapSegmentedLines(parsedSegments, wrapWidthPx, isBold, fontId).length
			}
		} else if (wrapBreaks !== undefined) {
			wrapBreaksApplied = wrapBreaks
			lines = wrapBreaks.length === 0 ? 1 : wrapBreaks.length + 1
		} else {
			lines = wrapLines(content, wrapWidthPx, isBold, fontId)
		}
		const lineHeightBlocks = pxToTextLineHeight(scalePx, fontId)
		// `width: fit-content` (prose): resolve to the longest visual
		// line's char count × MC's default-font char width (~7 px per char
		// in default scale, conservative vs the literal 6 px to absorb
		// wider glyphs like 'd', 'm', 'w'). Cap at slide width. When
		// inline formatting is active, measure each line using the
		// loader's actual per-char widths so monospace spans contribute
		// the correct pixel cost.
		if (width?.unit === 'fit-content') {
			let longestPx = 0
			if (styledContent) {
				for (const seg of styledContent) {
					const bold = seg.bold ?? isBold
					const fontIdForSeg = seg.font ?? fontId
					for (const ch of seg.text) longestPx += charWidth(ch, bold, fontIdForSeg)
				}
			} else {
				longestPx = textWidth(content, isBold, fontId)
			}
			// Convert pixel width back into MC blocks (1 block = 16 px).
			const naturalWidthBlocks = Math.min(sceneW, longestPx / 16)
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
		// HACK: `shift-up` JSX prop. Positive value moves the element
		// up by N blocks at placement time. Number or numeric string.
		const shiftUpRaw = node.props?.['shift-up']
		const shiftUp = typeof shiftUpRaw === 'number'
			? shiftUpRaw
			: typeof shiftUpRaw === 'string' && shiftUpRaw !== ''
				? Number(shiftUpRaw)
				: 0
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
			styledContent,
			shiftUp: Number.isFinite(shiftUp) ? shiftUp : 0,
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
	// `[left, right]` chars of side-padding inside the `│` borders.
	// Default `[1, 1]`; `[0, 0]` makes content touch the borders.
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
		extraRow,
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
	let viewportCodeRows = Math.max(1, Math.floor(codeAreaBlocks / lineHeightBlocks))
	// HACK: `extra-row` adds 1 visible code row. Compresses the chunk
	// count down by 1 (or 0 if total ≤ new viewport), so the user
	// sees one more line of code on screen. Companion to the entity
	// shift in layout/index.ts.
	if (el.extraRow) viewportCodeRows += 1
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

const no_op = () => {
	summon('armor_stand', '~ ~ ~', {
		CustomName: {
			text: 'Funny guy',
			color: 'yellow',
			bold: true,
		}
	})
}

// Default source for the showcase `<autocomplete>` element when no
// `source` prop is provided. The choice is deliberate: it covers two
// IntelliSense moments — entity IDs (inside the first string literal)
// and NBT keys (inside the object literal) — and uses real Sandstone
// syntax so the syntax-highlight pipeline is exercised.
export const DEFAULT_AUTOCOMPLETE_SOURCE = `summon('armor_stand', '~ ~ ~', {
  CustomName: {
    text: 'Funny guy',
    color: 'yellow',
    bold: true,
  }
})`

// Number of code rows the autocomplete editor always renders, regardless
// of how many source lines have been typed. The final state fills all
// `MAX_CODE_LINES` with real content; intermediate stages pad the
// remaining rows with empty placeholder lines (no line numbers) so the
// editor visually shows a fixed-height IDE-style code area.
//
// Matches the line count of `DEFAULT_AUTOCOMPLETE_SOURCE` (5). Callers
// overriding `source` with a longer value would need to either keep the
// current MAX_CODE_LINES (and accept trailing rows truncated by MC's
// line_width wrap) or expose this as a prop — left as-is for now.
const MAX_CODE_LINES = DEFAULT_AUTOCOMPLETE_SOURCE.split('\n').length

// Build the layout record for a `<autocomplete>` element. Emits three
// layered text_display entities per element (editor + cursor + popup);
// the per-slide tick MCFunction in `slides/show.ts` drives all three
// per stage via the per-stage `stages[]` array.
//
// Dimensions mirror `<code>` — bordered source, monospace font, scroll
// not requested — so we reuse `codeBorders.buildRows` for the FULL
// typed source and then derive per-stage snapshots by wrapping the
// progressive prefix via `codeBorders.wrap`. Each stage's editor text
// has its own top + bottom border so chunk swap looks identical to the
// scrolling `<code>` mechanism.
//
// Popup snapshots are baked the same way (bordered list rows). The
// tick MCFunction swaps the popup's `text` and toggles its
// `text_opacity` based on whether the current stage falls inside an
// IntelliSense moment.
function computeAutocompleteLayout(
	node: VNode,
	path: string[],
	parentStack: CssDeclarations,
	declarations: CssDeclarations,
	sceneW: number,
	sceneH: number,
	codePrecomputed: WeakMap<VNode, Precomputed>,
): AutocompleteElementLayout {
	const autoId = `ac_${nextAutocompleteId++}`
	const content = (typeof node.props?.source === 'string' && node.props.source) ||
		DEFAULT_AUTOCOMPLETE_SOURCE

	const lang = (typeof node.props?.lang === 'string' && node.props.lang) || 'typescript'

	const fontSize = parseLength(declarations['font-size'] ?? '', sceneH)
	const scalePx = fontSize?.px ?? defaultFontPx('code')
	const textScale = pxToTextScale(scalePx)
	const BASELINE_TEXT_SCALE = pxToTextScale(10)
	const widthCompensation = BASELINE_TEXT_SCALE / textScale

	const fontId = declarations.font ?? 'sandstone_summit_booth:monospace'

	// Width resolution — prop → LESS → default. `fit-content` shrinks to
	// the longest source line, same rule as `<code>`.
	const widthRaw =
		(typeof node.props?.width === 'string' && node.props.width) ||
		declarations.width ||
		'50vw'
	let width = parseLength(widthRaw, sceneW)
	if (width === undefined || width.unit === 'fit-content') {
		const minLineWidthPx = computeMinCodeLineWidthPx(content, 0)
		const pxInDefault = minLineWidthPx / widthCompensation
		width = { value: pxInDefault, unit: 'px', px: pxInDefault, meters: pxInDefault / 16 }
	}

	const heightLen = parseLength(
		(typeof node.props?.height === 'string' && node.props.height) || declarations.height || '32vh',
		sceneH,
	)

	const lineNumbers =
		node.props?.['line-numbers'] === true || node.props?.['line-numbers'] === 'true' ||
		declarations['line-numbers'] === 'true'
	const sidePadding: [number, number] = Array.isArray(node.props?.['side-padding'])
		? (node.props['side-padding'] as [number, number])
		: [1, 1]

	const sourceLineCount = content.split('\n').length
	const gutterChars = lineNumbers ? Math.max(2, String(sourceLineCount).length) : 0

	// Build bordered rows for the FULL typed source so we know the
	// viewport layout (top border + code rows + bottom border). Per-stage
	// snapshots take the prefix and wrap again — the same `codeBorders.wrap`
	// machinery used by non-scroll `<code>`.
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
	const totalVisualLines = codeRows.codeRows.length + 2 // +2 for top + bottom borders
	const cellH = heightLen?.meters ?? lineHeightBlocks * totalVisualLines
	const cellW = width?.meters ?? sceneW

	const { top: marginTop, bottom: marginBottom } = parseMarginBox(declarations, sceneH)

	// Cursor blink interval (in ticks). Default 5 = ~0.25s at 20 tps.
	const cursorBlink = 5

	// Popup defaults — content shown during the two IntelliSense moments.
	// Highlighted entry is always index 0 (`minecraft:zombie` for entity
	// IDs, `Tags` for NBT keys).
	const ENTITY_IDS = ['minecraft:zombie', 'minecraft:skeleton', 'minecraft:creeper', 'minecraft:spider']
	const NBT_KEYS = ['Tags', 'Health', 'CustomName', 'HandItems']

	// Stage indices where each IntelliSense moment starts. Defaults tuned
	// to the showcase source: entity popup fires after typing `'`
	// (stage 10), NBT popup fires after typing `{ ` (stage 47).
	const entityStageStart =
		typeof node.props?.['intellisense-entity-stage'] === 'number'
			? (node.props['intellisense-entity-stage'] as number)
			: 10
	const nbtStageStart =
		typeof node.props?.['intellisense-nbt-stage'] === 'number'
			? (node.props['intellisense-nbt-stage'] as number)
			: 47

	// Each popup moment is visible for WINDOW stages. Long enough for the
	// user to read, short enough that typing resumes before the slide ends.
	const POPUP_WINDOW = 6

	const cursorColor = ((declarations['cursor-color'] as `#${string}` | undefined) ??
		'#ffffff') as `#${string}`

	const popupBg = declarations['popup-bg'] as `#${string}` | undefined

	// Popups are sized to the MINIMUM width that fits the longest
	// IntelliSense entry with its `= ` prefix and NO border overhead.
	// We measure the longest entry's actual rendered pixel width via
	// `textWidth` (accounts for per-glyph widths in the popup's font).
	// The popup is forced to monospace by `buildTextJson`'s per-type
	// rule (`'autocomplete'` → `sandstone_summit_booth:monospace`),
	// unless the LESS explicitly sets `font:`. Match that here so the
	// `line_width` matches what MC will actually render.
	//
	// The width is computed PER STAGE — the entity-ID moment and the
	// NBT-key moment have different longest entries (`minecraft:skeleton`
	// vs `CustomName`), so a single global `popupWidthPx` was over-sizing
	// the NBT popup's quad and shifting its visible content right of
	// where the cursor anchor formula placed the entity origin. The tick
	// now writes the per-stage width to the segment entities' `line_width`
	// so each moment has its own correctly-sized quad.
	const popupFontId =
		declarations.font ?? 'sandstone_summit_booth:monospace'
	const widestEntityRow = '= ' + ENTITY_IDS.reduce((a, b) =>
		textWidth(b, false, popupFontId) > textWidth(a, false, popupFontId) ? b : a,
	)
	const widestNbtRow = '= ' + NBT_KEYS.reduce((a, b) =>
		textWidth(b, false, popupFontId) > textWidth(a, false, popupFontId) ? b : a,
	)
	const widestEntityRowPx = textWidth(widestEntityRow, false, popupFontId)
	const widestNbtRowPx = textWidth(widestNbtRow, false, popupFontId)
	if (process.env.DEBUG_AUTOCOMPLETE) {
		console.log(
			`[autocomplete-debug] popupFontId=${popupFontId} ` +
			`widestEntityRow=${JSON.stringify(widestEntityRow)}(${widestEntityRow.length - 2}ch) ` +
			`entityPx=${widestEntityRowPx} ` +
			`widestNbtRow=${JSON.stringify(widestNbtRow)}(${widestNbtRow.length - 2}ch) ` +
			`nbtPx=${widestNbtRowPx} scalePx=${scalePx}`,
		)
	}
	// The popup is split into consecutive BG-COLOR RUNS — rows that share
	// the same background become a single text_display entity (so e.g.
	// a 4-row popup with `[blue, gray, gray, gray]` becomes 2 entities:
	// one 1-line blue segment + one 3-line gray segment). MC text
	// components can't carry per-segment backgrounds, but a single
	// text_display with all-same-bg rows joined by `\n` renders those
	// rows as one entity that visually looks identical to N separate
	// row entities.
	const otherRowBg = declarations['popup-other-bg'] as `#${string}` | undefined
	const selectedRowBgInt: number = popupBg ? (parseColorInt(popupBg) ?? 0) : 0
	const otherRowBgInt: number = otherRowBg ? (parseColorInt(otherRowBg) ?? 0) : 0
	// Row count = max entries across the two popup moments; today both
	// use 4 items, but this stays correct if the lists ever diverge.
	const popupMaxRowCount = Math.max(ENTITY_IDS.length, NBT_KEYS.length)
	const rowBgInts: number[] = Array.from(
		{ length: popupMaxRowCount },
		(_, idx) => (idx === 0 ? selectedRowBgInt : otherRowBgInt),
	)

	// Cursor glyph width/height in blocks — both used to anchor the
	// popup's TOP-LEFT to the cursor's TOP-RIGHT each stage. — both used to anchor the
	// popup's TOP-LEFT to the cursor's TOP-RIGHT each stage. The cursor
	// uses the declarations' font (or the default font if unset) at
	// `textScale`. `charWidth` returns bitmap px; multiply by scale
	// and divide by 32 to get blocks.
	const cursorFontId = declarations.font ?? DEFAULT_FONT_ID
	const cursorCharWidthPx = charWidth('|', false, cursorFontId)
	const cursorWidthBlocks = (cursorCharWidthPx * textScale) / 32
	const cursorHeightBlocks = pxToTextLineHeight(scalePx, cursorFontId)

	// Per-row line height in blocks at the popup's font/scale. The popup
	// is N rows (no border rows) split into consecutive bg-color
	// segments — each segment renders as its own text_display.
	const popupLineHeightBlocks = pxToTextLineHeight(scalePx, popupFontId)
	// Height for one set of popup entries (ENTITY_IDS or NBT_KEYS share
	// the same count today).
	const popupHeightBlocks = popupLineHeightBlocks * ENTITY_IDS.length

	// Group consecutive rows with the same background color into
	// segments. Each segment is a single text_display entity whose
	// `text` contains the segment's rows joined by `\n`, and whose
	// `background` is the segment's bgInt. `offsetYBlocks` is the
	// STATIC Y offset (in blocks, positive = down) from the per-stage
	// popup anchor Y to where this segment's entity should sit so its
	// first row lands at the right vertical position within the popup.
	//
	// The first segment (s=0, the SELECTED / top row) gets an extra
	// `- popupLineHeightBlocks` so its single-line quad sits a full
	// line above the analytical position — empirically MC's text
	// rendering for a 1-line segment renders at the QUAD's vertical
	// CENTER rather than its top, which means without this nudge the
	// selected row's GLYPHS sit at the OLD popup's "zombie baseline"
	// instead of "zombie center", visually overlapping the row below.
	type Segment = AutocompleteElementLayout['popupSegments'][number]
	const popupSegments: Segment[] = (() => {
		const segs: Segment[] = []
		let s = 0
		while (s < popupMaxRowCount) {
			const bgInt = rowBgInts[s]
			let e = s + 1
			while (e < popupMaxRowCount && rowBgInts[e] === bgInt) e++
			const heightBlocks = (e - s) * popupLineHeightBlocks
			let offsetYBlocks =
				popupHeightBlocks / 2
				- s * popupLineHeightBlocks
				- (e - s) * popupLineHeightBlocks / 2
			if (s === 0) offsetYBlocks += popupLineHeightBlocks
			segs.push({ bgInt, startRow: s, endRow: e, heightBlocks, offsetYBlocks })
			s = e
		}
		return segs
	})()

	// MC text_display's quad is CENTERED on the entity origin regardless
	// of `alignment`. `alignment='left'` left-justifies the text within
	// the centered quad, so the visible TEXT LEFT edge sits at
	// `popupEntityX - popupQuadHalfWidth`. The half-width is now
	// computed PER STAGE in the tick (from `popupWidthPxPerStage / 64`),
	// since the popup width differs between the entity-ID moment and
	// the NBT-key moment. The static `popupQuadHalfWidthBlocks` field
	// is removed — the tick derives the right value per stage.

	// Walk the source char-by-char, producing one stage per typed char.
	// `editorContent[stage]` = bordered text wrapping `content.slice(0, stage + 1)`,
	// padded out to `MAX_CODE_LINES` rows with empty placeholder rows (no line
	// numbers, just blank space between `│`s). This makes the editor show a
	// fixed-height IDE-style code area: as the user types into later lines,
	// empty rows disappear from the bottom. The final state fills all
	// `MAX_CODE_LINES` rows.
	const stages: AutocompleteElementLayout['stages'] = []
	const popupWidthPxPerStage: number[] = []
	const popupTriggerColumnBlocksPerStage: number[] = []
	for (let s = 0; s <= content.length; s++) {
		const slice = content.slice(0, s)
		const bordered = buildPaddedCodeBordered(
			slice,
			lang,
			fontId,
			fullWrapWidthPx,
			lineNumbers,
			sourceLineCount,
			declarations,
			sidePadding,
			MAX_CODE_LINES,
		)

		// Cursor position: count newlines in `slice` to know which source
		// line the cursor is on, then count chars since last newline for
		// the column. Convert to block offsets from the editor's center.
		const newlinesBefore = (slice.match(/\n/g) ?? []).length
		const lastNewlineIdx = slice.lastIndexOf('\n')
		const colChars = lastNewlineIdx >= 0
			? slice.length - lastNewlineIdx - 1
			: slice.length

		const charWidthBlocks = 0.375
		const CURSOR_HORIZONTAL_OFFSET_CHARS = 12
		// TODO: unrelated to this but the autocomplete demo element is causing console error spam on the server, figure out the slopcode causing that
		const CURSOR_DRIFT_PER_CHAR = 0.07
		const paddingLeftBlocks = (sidePadding[0] + (lineNumbers ? gutterChars + 3 : 0) + 1) * charWidthBlocks
		// Cursor visual CENTER positioned at the typed-text end of the
		// editor's bordered line. The line has a `│` border on each side
		// and the cursor text (`|`) is centered on its entity origin.
		// Position = `paddingLeftBlocks + colChars * (charWidthBlocks - CURSOR_DRIFT_PER_CHAR) -
		// CURSOR_HORIZONTAL_OFFSET_CHARS * charWidthBlocks - 0.5`
		// (empirically tuned — `-12 * charWidthBlocks - 0.5` puts the
		// cursor entity X such that the popup appears 1.2 blocks past
		// the cursor's visual right edge when the popup is at the OLD
		// formula's position).
		const cursorXBlocks =
			paddingLeftBlocks +
			colChars * (charWidthBlocks - CURSOR_DRIFT_PER_CHAR) -
			CURSOR_HORIZONTAL_OFFSET_CHARS * charWidthBlocks -
			0.5
		const visualRowOfCursor = newlinesBefore + 2
		const cursorYBlocks = cellH - visualRowOfCursor * lineHeightBlocks

		// Popup state at this stage.
		const inEntityRange = s >= entityStageStart && s < entityStageStart + POPUP_WINDOW
		const inNbtRange = s >= nbtStageStart && s < nbtStageStart + POPUP_WINDOW
		const popupVisible = inEntityRange || inNbtRange
		// Per-stage popup width — entity vs NBT moment has different
		// longest entries (`minecraft:skeleton` vs `CustomName`), so
		// pick the right one based on which moment this stage is in.
		// 0 when the popup is hidden (so the tick can skip the line_width
		// emit entirely).
		const popupWidthPx: number = inNbtRange
			? widestNbtRowPx
			: inEntityRange
				? widestEntityRowPx
				: 0
		// Per-row segments (StyledSegment[] per row) — built once per
		// stage when the popup is visible. We then group consecutive rows
		// by segment below to produce per-segment content for the tick.
		const rowSegments = popupVisible
			? buildPopupRows(
				inNbtRange ? NBT_KEYS : ENTITY_IDS,
				0,
				declarations,
			)
			: []
		const popupSegmentContent: StyledSegment[][] = popupSegments.map((seg) => {
			if (!popupVisible) return []
			// Concatenate this segment's rows, separated by `\n` segments
			// (so MC renders them as separate lines within the entity's
			// multi-line quad).
			const out: StyledSegment[] = []
			for (let r = seg.startRow; r < seg.endRow; r++) {
				if (r > seg.startRow) {
					out.push({ text: '\n', color: '#ffffff' as `#${string}` })
				}
				for (const s2 of rowSegments[r] ?? []) out.push({ ...s2 })
			}
			return out
		})
		const popupHighlightIdx = popupVisible ? 0 : -1

		// Per-stage popup trigger column (principled math, no -12 hack):
		// place the cursor's visual center at the end of the typed text on
		// the current line. The `│` border occupies one char before col 0
		// (`+ charWidthBlocks`), then `colChars` chars of typed text
		// (`+ colChars * charWidthBlocks`); the cursor is centered on its
		// own position (so add `+ charWidthBlocks/2` for centering).
		const popupTriggerColumnBlocks =
			paddingLeftBlocks +
			colChars * charWidthBlocks +
			charWidthBlocks / 2

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

	// `stageCount` indexes stages [0..N-1] where N = content.length (one
	// stage per typed char). We clamp to [0, stageCount-1] in the tick.
	const stageCount = stages.length

	return {
		kind: 'autocomplete',
		node,
		path,
		parentStack,
		declarations,
		type: 'autocomplete',
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
		autoId,
		stageCount,
		stages,
		cursorBlink,
		sourceLineCount,
		popupTriggerColumnBlocks: popupTriggerColumnBlocksPerStage,
		popupWidthPxPerStage,
		popupSegments,
		cursorColor,
		cursorWidthBlocks,
		cursorHeightBlocks,
		popupLineHeightBlocks,
		popupHeightBlocks,
		entityStageStart,
		nbtStageStart,
	}
}

// Build a per-row, border-free text_display representation of a small
// IntelliSense dropdown. Each row is its own `StyledSegment[]` (no `\n`
// separators, no border characters) so the popup can be rendered as N
// separate text_displays — one per row — and each row can carry its own
// `background` NBT. Every row is prefixed with `= ` and rendered in white
// (`#ffffff`); the `highlightIdx` arg is retained for symmetry with the
// bordered version and is currently unused (selection is conveyed by the
// top row's background color, set by the caller).
//
// Each row is padded with trailing spaces to match the longest entry's
// rendered width. Keeps the per-row visual width consistent so the
// `<autocomplete>` background quads line up — e.g. zombie (`=  …zombie`)
// gets `Math.max(...items.map(len)) - 16` trailing spaces to match
// skeleton's longer length.
function buildPopupRows(
	items: string[],
	_highlightIdx: number,
	_declarations: CssDeclarations,
): StyledSegment[][] {
	const white: `#${string}` = '#ffffff'
	const longestItemLen = items.reduce((maxLen, item) => Math.max(maxLen, item.length), 0)
	return items.map((item): StyledSegment[] => {
		const out: StyledSegment[] = [
			{ text: '= ', color: white },
			{ text: item, color: white },
		]
		const padLen = longestItemLen - item.length
		if (padLen > 0) {
			out.push({ text: ' '.repeat(padLen), color: white })
		}
		return out
	})
}

// Build a bordered text_display representation of the editor's current
// `slice`, padded out to `maxLines` visual rows with empty placeholder
// rows. The active rows (whatever `codeBorders.buildRows` produces for
// `slice`) keep their full bordered structure (line numbers, content,
// colors). The empty rows below them match the active row's width so
// the borders stay aligned, but contain no line numbers or content —
// just `│` + spaces + `│` rendered as a single border-colored segment.
//
// Used by `<autocomplete>` so the editor's visible area stays a fixed
// `maxLines` rows tall as typing progresses; the final state has all
// `maxLines` filled with real content (no empty rows).
function buildPaddedCodeBordered(
	slice: string,
	lang: string,
	fontId: string,
	fullWrapWidthPx: number,
	lineNumbers: boolean,
	sourceLineCount: number,
	declarations: CssDeclarations,
	sidePadding: [number, number],
	maxLines: number,
): StyledSegment[] {
	const borderColor = declarations['border-color'] as `#${string}` | undefined
	const langColor = declarations['lang-color'] as `#${string}` | undefined
	const codeColor = declarations.color as `#${string}` | undefined
	const gutterColor = declarations['gutter-color'] as `#${string}` | undefined

	const rows = codeBorders.buildRows({
		content: slice,
		language: lang,
		fontId,
		lineWidthPx: fullWrapWidthPx,
		bold: false,
		borderColor,
		langColor,
		codeColor,
		precomputed: undefined,
		lineNumbers,
		lineCount: sourceLineCount,
		gutterColor,
		sidePadding,
	})

	const numEmptyRows = Math.max(0, maxLines - rows.codeRows.length)
	// Empty row matches the line-numbered row's outer width so the
	// left/right `│` borders stay vertically aligned with the active
	// rows above. The interior preserves the gutter STRUCTURE (left
	// border + blank gutter slot + ` │ ` separator + blank content
	// area + right border) but with no line number and no text — so
	// the box looks like a row that's waiting for input, not a
	// collapsed `│        │`.
	const gutterChars = rows.gutterChars
	const longestInnerChars = rows.longestInnerChars
	const emptyRowText =
		'│ ' + ' '.repeat(gutterChars) + ' │ ' + ' '.repeat(longestInnerChars) + ' │'

	const out: StyledSegment[] = []
	for (const seg of rows.topBorder) out.push({ ...seg })
	for (const row of rows.codeRows) for (const seg of row) out.push({ ...seg })
	for (let i = 0; i < numEmptyRows; i++) {
		out.push({ text: '\n', color: borderColor })
		out.push({ text: emptyRowText, color: borderColor })
	}
	if (rows.bottomBorder.length > 0) {
		out.push({ text: '\n', color: rows.bottomBorder[0].color })
		for (const seg of rows.bottomBorder) out.push({ ...seg })
	}
	return out
}