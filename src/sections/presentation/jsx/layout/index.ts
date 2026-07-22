// Top-level layout entry: given visible elements + styles + scene
// dimensions, summon every entity into MCFunctions emitted to the
// currently-active callback. Internally:
//   1. computeElementLayout → per-element layout records
//   2. groupIntoBlocks → split into single-element blocks + row-flow blocks
//   3. iterate blocks, compute positioning, summon each entity
//
// The placement pass is shared with `computeSlideTickSpecs`, which
// runs the same math without emitting any `summon` commands — letting
// the slide show build its scroll + autocomplete tick MCFunctions
// ahead of mount.

import { parseLength, pxToTextLineHeight } from '../length'
import type { LabelClass } from 'sandstone'
import type { NodeWithPath } from '../tree/walk'
import type { VNode, StyledSegment } from '../render'
import type { Styles } from '../style'
import type { CssDeclarations } from '../less/types'
import { computeElementLayout, finalizeScrollCodeLayout, type ElementLayout, type ImgResourceMap } from './element'
import type { Precomputed } from './code-borders'
import type { RowFlexWidth } from '../prepare/row-flex'
import { blockCellH, blockGap, columnBlockNaturalHeight, groupIntoBlocks, rowDownShift, startingY, totalStackHeight, type Block } from './blocks'
import { summonElement } from './summon-entity'
import { TEXT_RENDER_OFFSET, Z_VISUAL_OFFSET, getTextDescender, parityOffset } from './constants'

export type CodePrecomputedMap = WeakMap<VNode, Precomputed>

/** Spec captured during layout, consumed by the slide's scroll-tick. */
export type ScrollSpec = {
	/** Unique tag set on the (single) scroll entity at summon time. */
	scrollTag: LabelClass
	/** Entity's initial Y in world blocks (cellY - 1). */
	startY: number
	/** Total scroll distance in world blocks (positive). */
	scrollDistBlocks: number
	/** Height of one visual line in blocks — drives the TUI line-step. */
	lineHeightBlocks: number
	/** Number of viewport-sized chunks the scroll block was split into. */
	chunkCount: number
	/** Per-chunk bordered content. The tick picks `chunks[visibleIdx]`. */
	chunks: { content: StyledSegment[] }[]
	/** LESS declarations for the scroll element — drive `buildTextJson`. */
	declarations: CssDeclarations
	/** Element type ('code' for scrolling blocks today). */
	type: string
}

/**
 * Spec captured during layout for a `<autocomplete>` element.
 * Consumed by `sections/presentation/slides/autocomplete/<idx>` to drive the
 * editor text swap + cursor translation/blink + popup text+visibility
 * per typing stage.
 */
export type AutocompleteSpec = {
	/** Stable identifier suffixed onto per-role tags (`ac_<autoId>`). */
	autoId: string
	/** Stage count for this element — the tick clamps `elapsed/ticksPerStage` to `[0, stageCount-1]`. */
	stageCount: number
	/** Cursor blink half-period in ticks (default 5). */
	cursorBlink: number
	/** Number of source lines in the snippet being typed out. Used by
	 * the tick to derive the popup's Y offset from the cursor anchor. */
	sourceLineCount: number
	/** Per-stage popup trigger column, in BLOCKS from the editor anchor X.
	 * The principled "where the popup should appear" value at this
	 * stage (= paddingLeft + colChars * charWidthBlocks + charWidthBlocks/2,
	 * the cursor's visual center at the end of the typed text on the
	 * current line). Tracked so future formula revisions can target the
	 * right value without re-deriving from the typed slice every time.
	 * The live cursor X math currently uses an empirically-tuned constant
	 * (-12 hack) instead. */
	popupTriggerColumnBlocks: number[]
	/** Stage at which the NBT-key popup moment begins (the `Tags`
	 * IntelliSense moment). Used by the tick's debug-freeze to pin the
	 * animation at the NBT popup's first visible frame. */
	nbtStageStart: number
	/** LESS declarations for editor text — drives `buildTextJson` per stage. */
	editorDeclarations: CssDeclarations
	/** LESS declarations for popup text — drives `buildTextJson` per stage. */
	popupDeclarations: CssDeclarations
	/** Popup's `line_width` in px, PER STAGE (index = stage). Different
	 * moments have different longest entries (entity vs NBT key), so
	 * each moment gets its own width. 0 when the popup is hidden at
	 * that stage. */
	popupWidthPxPerStage: number[]
	/** Cursor glyph width in blocks (for popup left-anchoring at cursor's right edge). */
	cursorWidthBlocks: number
	/** Cursor glyph height in blocks (one line at cursor's font/scale). */
	cursorHeightBlocks: number
	/** Per-row line height in blocks at the popup's font/scale. The tick
	 * uses this together with each segment's `offsetYBlocks` to position
	 * the segment entities relative to the per-stage popup anchor. */
	popupLineHeightBlocks: number
	/** Total popup height in blocks (entries only — no border rows). */
	popupHeightBlocks: number
	/** Static segment info: consecutive bg-color runs that share a single
	 * text_display entity. `offsetYBlocks` is the static Y offset from
	 * the per-stage popup anchor Y to position the segment so its first
	 * row lines up where it should within the popup quad. */
	popupSegments: {
		bgInt: number
		startRow: number
		endRow: number
		heightBlocks: number
		offsetYBlocks: number
	}[]
	/** Per-stage editor bordered content. Index = stage. */
	editorContent: StyledSegment[][]
	/** Per-stage cursor X offset (blocks) from editor's left edge. */
	cursorXPerStage: number[]
	/** Per-stage cursor Y offset (blocks) from editor's entity Y. */
	cursorYPerStage: number[]
	/** Per-stage popup `text_opacity` value (-1 visible, 0 hidden).
	 * Same value is applied to every popup segment entity for that stage. */
	popupVisiblePerStage: number[]
	/** Per-stage popup segment content: outer index = stage, middle =
	 * segment index, inner = segments for that segment (with `\n`
	 * separators between rows). Empty arrays when the popup is hidden
	 * at that stage. */
	popupSegmentContent: StyledSegment[][][]
}

/**
 * Where an entity will be rendered after placement. Captured during the
 * `runLayout` placement pass so off-screen / overflow checks can compare
 * the rendered bounds against the slide. `y` is the world Y the entity
 * sits at (text extends UPWARD from this point, so `y` is the bottom of
 * the rendered text for `<code>` / `<p>` / `<h*>` elements).
 */
export type Placement = {
	el: ElementLayout
	x: number
	y: number
	z: number
}

export function summonVisibleElements(
	visible: NodeWithPath[],
	styles: Styles,
	sceneW: number,
	sceneH: number,
	origin: readonly [number, number, number],
	extraTags: (`${any}${string}` | LabelClass)[],
	initialOpacity: number | undefined,
	codePrecomputed: CodePrecomputedMap,
	imgResources: ImgResourceMap,
	sceneTag: LabelClass,
	rowFlexWidths?: WeakMap<VNode, RowFlexWidth>,
	explorerPrecomputed: CodePrecomputedMap = new WeakMap(),
): { scrollSpecs: ScrollSpec[]; autocompleteSpecs: AutocompleteSpec[]; placements: Placement[] } {
	return runLayout(
		visible,
		styles,
		sceneW,
		sceneH,
		origin,
		codePrecomputed,
		imgResources,
		(el, x, y, z) => {
			summonElement(el, x, y, z, extraTags, sceneTag, initialOpacity)
		},
		rowFlexWidths,
		explorerPrecomputed,
	)
}

/**
 * Layout-only twin of `summonVisibleElements`. Runs the placement math
 * without emitting any `summon` commands — used during SlideShow
 * construction to collect per-slide tick specs (scroll + autocomplete)
 * before any MCFunction is built.
 */
export function computeSlideTickSpecs(
	visible: NodeWithPath[],
	styles: Styles,
	sceneW: number,
	sceneH: number,
	origin: readonly [number, number, number],
	codePrecomputed: CodePrecomputedMap,
	imgResources: ImgResourceMap,
	rowFlexWidths?: WeakMap<VNode, RowFlexWidth>,
	explorerPrecomputed: CodePrecomputedMap = new WeakMap(),
): {
	scrollSpecs: ScrollSpec[]
	autocompleteSpecs: AutocompleteSpec[]
	placements: Placement[]
} {
	return runLayout(
		visible,
		styles,
		sceneW,
		sceneH,
		origin,
		codePrecomputed,
		imgResources,
		() => {},
		rowFlexWidths,
		explorerPrecomputed,
	)
}

function runLayout(
	visible: NodeWithPath[],
	styles: Styles,
	sceneW: number,
	sceneH: number,
	origin: readonly [number, number, number],
	codePrecomputed: CodePrecomputedMap,
	imgResources: ImgResourceMap,
	onElement: (el: ElementLayout, x: number, y: number, z: number) => void,
	rowFlexWidths: WeakMap<VNode, RowFlexWidth> = new WeakMap(),
	explorerPrecomputed: CodePrecomputedMap = new WeakMap(),
): { scrollSpecs: ScrollSpec[]; autocompleteSpecs: AutocompleteSpec[]; placements: Placement[] } {
	const elements: ElementLayout[] = visible.map((nodeWithPath) =>
		computeElementLayout(nodeWithPath, styles, sceneW, sceneH, imgResources, codePrecomputed, rowFlexWidths, explorerPrecomputed),
	)

	// Scrolling `<code>` blocks start with `cellH = 0` placeholder; the
	// layout engine sizes them to fill remaining slide space after other
	// elements are placed. Measure the non-scroll stack first by simulating
	// `accY` advance (margins + gaps + row block heights included), then
	// finalize per-block so scrolls in a row block each get the full row
	// height (they share horizontal space, not vertical).
	const blocks0 = groupIntoBlocks(elements)
	const nonScrollH = simulateStackAdvance(blocks0, sceneH)
	// Clamp to ≥ 2 blocks so the box stays non-degenerate if other
	// elements overflow.
	const remaining = Math.max(2, sceneH - nonScrollH)
	for (const block of blocks0) {
		const blockScrollEls =
			block.kind === 'element'
				? block.el.kind === 'text' && typeof block.el.scrollTag === 'string'
					? [block.el]
					: []
				: block.children.filter(
						(c) => c.kind === 'text' && typeof c.scrollTag === 'string',
				  )
		if (blockScrollEls.length === 0) continue
		// Every scroll in this block gets the full available height —
		// within a row block, siblings share X space via `placeRowBlocks`,
		// so vertical space stays independent per sibling. Single-element
		// blocks trivially just take the remaining height.
		for (const el of blockScrollEls) {
			el.cellH = remaining
			finalizeScrollCodeLayout(el)
		}
	}

	const blocks = groupIntoBlocks(elements)
	const totalH = totalStackHeight(blocks, sceneH)
	let accY = startingY(sceneH, totalH, blocks)
	const z = origin[2] + Z_VISUAL_OFFSET

	const placements: Placement[] = []
	const scrollSpecs: ScrollSpec[] = []
	const autocompleteSpecs: AutocompleteSpec[] = []
	for (let bi = 0; bi < blocks.length; bi++) {
		const block = blocks[bi]
		if (block.kind === 'element') {
			const el = block.el
			const cellY = origin[1] + accY - el.marginTop - el.cellH + parityOffset(sceneH)
			// Entity Y depends on element kind:
			//   scroll `<code>`:  cellY - TEXT_RENDER_OFFSET (see constants)
			//   prose/h/code:     cellY - TEXT_RENDER_OFFSET (see constants)
			//   image:            cellY + cellH / 2 (image is centered in cell)
			//   autocomplete:     cellY - TEXT_RENDER_OFFSET (text-style anchor)
			// `TEXT_RENDER_OFFSET` accounts for MC text_display's fixed
			// gap between the entity Y and the visible glyph bottom.
			// Without it, the topmost element on a tightly-stacked slide
			// renders that many blocks above the slide's top edge.
			let entityY =
				el.kind === 'text' && typeof el.scrollTag === 'string'
					? cellY - TEXT_RENDER_OFFSET
					: el.kind === 'image'
						? cellY + el.cellH / 2
						: cellY - TEXT_RENDER_OFFSET
			// HACK: `extra-row` JSX prop. Shifts a scroll `<code>` entity
			// up by 1 line height so a following paragraph can claim the
			// freed space. Companion to the +1 viewport row in
			// finalizeScrollCodeLayout. Only applied to scroll blocks.
			if (el.kind === 'text' && typeof el.scrollTag === 'string' && el.extraRow) {
				entityY -= pxToTextLineHeight(el.scalePx, el.fontId) - .75
			}
			// HACK: `shift-up` JSX prop. Nudges any text element up by N
			// blocks at placement time. Positive value moves the rendered
			// text up in altitude.
			if (el.kind === 'text' && el.shiftUp) {
				entityY += el.shiftUp
			}

			const entityX = origin[0] + sceneW / 2
			onElement(el, entityX, entityY, z)
			placements.push({ el, x: entityX, y: entityY, z })
			maybeRecordScroll(el, entityY, scrollSpecs)
			maybeRecordAutocomplete(el, entityY, entityX, z, autocompleteSpecs)
			accY -= el.marginTop + el.cellH
			if (bi < blocks.length - 1) {
				accY -= blockGap(block, blocks[bi + 1], sceneH) + el.marginBottom
			}
		} else if (block.kind === 'row') {
			accY = placeRowBlocks(
				block,
				accY,
				sceneW,
				sceneH,
				origin,
				z,
				onElement,
				scrollSpecs,
				autocompleteSpecs,
				placements,
			)
			if (bi < blocks.length - 1) {
				const lastChild = block.children[block.children.length - 1]
				accY -= blockGap(block, blocks[bi + 1], sceneH) + lastChild.marginBottom
			}
		} else {
			accY = placeColumnBlocks(
				block,
				accY,
				sceneW,
				sceneH,
				origin,
				z,
				onElement,
				scrollSpecs,
				autocompleteSpecs,
				placements,
			)
			if (bi < blocks.length - 1) {
				const lastChild = block.children[block.children.length - 1]
				accY -= blockGap(block, blocks[bi + 1], sceneH) + lastChild.marginBottom
			}
		}
	}
	return { scrollSpecs, autocompleteSpecs, placements }
}

function placeRowBlocks(
	block: Extract<Block, { kind: 'row' }>,
	accY: number,
	sceneW: number,
	sceneH: number,
	origin: readonly [number, number, number],
	z: number,
	onElement: (el: ElementLayout, x: number, y: number, z: number) => void,
	scrollSpecs: ScrollSpec[],
	autocompleteSpecs: AutocompleteSpec[],
	placements: Placement[],
): number {
	const columnGap = parseLength(block.parentStack['column-gap'] ?? '', sceneW)?.meters ?? 0

	// `height` on the parent: takes that portion of the remaining
	// vertical space (`accY`), anchored to the bottom.
	const heightProp = block.parentStack.height
	let containerCellH: number
	let bottomAnchored = false
	if (heightProp) {
		const pctMatch = heightProp.trim().match(/^(-?\d*\.?\d+)\s*%$/i)
		const heightMeters = pctMatch
			? (parseFloat(pctMatch[1]) / 100) * accY
			: (parseLength(heightProp, sceneH)?.meters ?? 0)
		containerCellH = Math.max(blockCellH(block), heightMeters)
		bottomAnchored = true
	} else {
		containerCellH = blockCellH(block)
	}

	const containerCellW =
		block.children.reduce((sum, c) => sum + c.cellW, 0) +
		Math.max(0, block.children.length - 1) * columnGap

	const firstChild = block.children[0]
	const containerCenterX = origin[0] + sceneW / 2

	let workingY = accY - firstChild.marginTop
	if (bottomAnchored) {
		// Reset workingY to 0 so next sibling is flush against container top.
		workingY = 0
	} else {
		workingY -= containerCellH
	}
	if (process.env.DEBUG_JSX_ROW) {
		console.log(
			`[row-debug] accY=${accY} marginTop=${firstChild.marginTop} containerCellH=${containerCellH} ` +
			`bottomAnchored=${bottomAnchored} columnGap=${columnGap} children=${block.children.length} ` +
			`rowDownShift=${rowDownShift(columnGap, block.children.length)} ` +
			`=> workingY=${workingY - rowDownShift(columnGap, block.children.length)}`,
		)
	}

	if (bottomAnchored) {
		workingY += TEXT_RENDER_OFFSET
	} else {
		workingY -= rowDownShift(columnGap, block.children.length)
	}
	const containerCenterY = origin[1] + workingY + containerCellH / 2

	// When row fits in scene, center whole group symmetrically. When it
	// overflows (hardcoded `width: 95vw`), anchor middle child to scene
	// center so geometric focus stays put and rest overflows symmetrically.
	let accX: number
	if (containerCellW <= sceneW) {
		accX = containerCenterX - containerCellW / 2
	} else {
		const middleIndex = Math.floor(block.children.length / 2)
		accX = containerCenterX - block.children[middleIndex].cellW / 2
		for (let i = middleIndex - 1; i >= 0; i--) accX -= block.children[i].cellW + columnGap
	}

	for (const child of block.children) {
		const subCellY = containerCenterY - child.cellH / 2
		const childCenterX = accX + child.cellW / 2
		// Entity Y depends on element kind — mirrors the non-row placement
		// (scroll/prose/image each have their own anchor convention).
		// `TEXT_RENDER_OFFSET` is applied to text elements for the same
		// reason as in `runLayout` above.
		let entityY =
			child.kind === 'text' && typeof child.scrollTag === 'string'
				? subCellY - TEXT_RENDER_OFFSET
				: child.kind === 'image'
					? subCellY + child.cellH / 2
					: subCellY - TEXT_RENDER_OFFSET
		// HACK: `extra-row` JSX prop. Shifts a scroll `<code>` entity
		// up by 1 line height so a following paragraph can claim the
		// freed space. Mirror of the shift in `runLayout` — both
		// placement paths need to agree, since this slide's code blocks
		// live inside a row block.
		if (child.kind === 'text' && typeof child.scrollTag === 'string' && child.extraRow) {
			entityY -= pxToTextLineHeight(child.scalePx, child.fontId) - .75
		}
		// HACK: `shift-up` JSX prop (see `runLayout`).
		if (child.kind === 'text' && child.shiftUp) {
			entityY += child.shiftUp
		}
		onElement(child, childCenterX, entityY, z)
		placements.push({ el: child, x: childCenterX, y: entityY, z })
		maybeRecordScroll(child, entityY, scrollSpecs)
		maybeRecordAutocomplete(child, entityY, childCenterX, z, autocompleteSpecs)
		accX += child.cellW + columnGap
	}

	return workingY
}

// Place a `column` block — a column container (e.g. `#text-grid`) whose
// LESS declares `align-items: center` AND a `height`. The container
// expands to `max(natural stack, height)`; the height value supports
// percentage units which resolve against the current `accY` (= remaining
// slide height when this column follows earlier content). Children stack
// vertically inside the container with `row-gap`, centered when the
// container is taller than the natural stack.
function placeColumnBlocks(
	block: Extract<Block, { kind: 'column' }>,
	accY: number,
	sceneW: number,
	sceneH: number,
	origin: readonly [number, number, number],
	z: number,
	onElement: (el: ElementLayout, x: number, y: number, z: number) => void,
	scrollSpecs: ScrollSpec[],
	autocompleteSpecs: AutocompleteSpec[],
	placements: Placement[],
): number {
	const rowGap = parseLength(block.parentStack['row-gap'] ?? '', sceneH)?.meters ?? 0

	const heightProp = block.parentStack.height
	const pctMatch = heightProp?.trim().match(/^(-?\d*\.?\d+)\s*%$/i)
	const naturalH = columnBlockNaturalHeight(block, sceneH)
	const heightMeters = pctMatch
		? (parseFloat(pctMatch[1]) / 100) * accY
		: (parseLength(heightProp ?? '', sceneH)?.meters ?? 0)
	const containerCellH = Math.max(naturalH, heightMeters)

	// Vertical center within the container: equal top/bottom padding so
	// the children land mid-container rather than flush against the top.
	const topPadding = Math.max(0, (containerCellH - naturalH) / 2)

	const centerX = origin[0] + sceneW / 2

	// `workingY` is the TOP of the next child's cell in scene coords.
	// Container top sits at `accY`; first child starts `topPadding` below
	// that, minus its marginTop.
	let workingY = accY - topPadding
	for (const child of block.children) {
		workingY -= child.marginTop
		const cellY = origin[1] + workingY - child.cellH + parityOffset(sceneH)
		// Entity Y mirrors `runLayout`'s element-kind dispatch so a
		// column-block text/image renders the same as a top-level one.
		let entityY =
			child.kind === 'text' && typeof child.scrollTag === 'string'
				? cellY - TEXT_RENDER_OFFSET
				: child.kind === 'image'
					? cellY + child.cellH / 2
					: cellY - TEXT_RENDER_OFFSET
		// HACK: `extra-row` JSX prop shift (see `runLayout`).
		if (child.kind === 'text' && typeof child.scrollTag === 'string' && child.extraRow) {
			entityY -= pxToTextLineHeight(child.scalePx, child.fontId) - .75
		}
		// HACK: `shift-up` JSX prop (see `runLayout`).
		if (child.kind === 'text' && child.shiftUp) {
			entityY += child.shiftUp
		}
		onElement(child, centerX, entityY, z)
		placements.push({ el: child, x: centerX, y: entityY, z })
		maybeRecordScroll(child, entityY, scrollSpecs)
		maybeRecordAutocomplete(child, entityY, centerX, z, autocompleteSpecs)
		workingY -= child.cellH + rowGap
	}

	return accY - containerCellH
}

// Simulate the vertical advance of `accY` over a stack of blocks —
// mirrors the math in `runLayout` (margins + gaps included) but never
// emits entities. Used to measure how much vertical space the non-scroll
// content consumes before scroll `<code>` blocks are sized to fill the
// rest of the slide.
//
// Row blocks contribute their natural cellH (max child cellH) — for
// rows containing only a scroll-code placeholder, this is 0, so the
// scroll element absorbs the row's `height: 100%` budget in the real
// `placeRowBlocks` pass. That keeps the simulated non-scroll height
// from double-counting the space the scroll code is about to claim.
function simulateStackAdvance(blocks: Block[], sceneH: number): number {
	let accY = sceneH
	for (let i = 0; i < blocks.length; i++) {
		const b = blocks[i]
		if (b.kind === 'element') {
			accY -= b.el.marginTop + b.el.cellH
			if (i < blocks.length - 1) {
				accY -= blockGap(b, blocks[i + 1], sceneH) + b.el.marginBottom
			}
		} else if (b.kind === 'row') {
			accY -= blockCellH(b)
			if (i < blocks.length - 1) {
				const lastChild = b.children[b.children.length - 1]
				accY -= blockGap(b, blocks[i + 1], sceneH) + lastChild.marginBottom
			}
		} else {
			// Column block: container height = max(natural stack, parsed
			// `height` of the remaining slide space). Matches the math
			// `placeColumnBlocks` uses, so the simulate pass doesn't
			// over- or under-count how much slide height the column eats.
			const naturalH = columnBlockNaturalHeight(b, sceneH)
			const heightProp = b.parentStack.height
			const pctMatch = heightProp?.trim().match(/^(-?\d*\.?\d+)\s*%$/i)
			const heightMeters = pctMatch
				? (parseFloat(pctMatch[1]) / 100) * accY
				: (parseLength(heightProp ?? '', sceneH)?.meters ?? 0)
			accY -= Math.max(naturalH, heightMeters)
			if (i < blocks.length - 1) {
				const lastChild = b.children[b.children.length - 1]
				accY -= blockGap(b, blocks[i + 1], sceneH) + lastChild.marginBottom
			}
		}
	}
	return sceneH - accY
}

function maybeRecordScroll(
	el: ElementLayout,
	startY: number,
	scrollSpecs: ScrollSpec[],
): void {
	if (el.kind !== 'text') return
	if (!el.scrollTag || !el.scrollDistBlocks || el.scrollDistBlocks <= 0) return
	scrollSpecs.push({
		scrollTag: el.scrollTag,
		startY,
		scrollDistBlocks: el.scrollDistBlocks,
		lineHeightBlocks: pxToTextLineHeight(el.scalePx, el.fontId),
		chunkCount: el.chunkCount ?? 1,
		chunks: el.chunks ?? [],
		declarations: el.declarations,
		type: el.type,
	})
}

// Mirror of `maybeRecordScroll` for `<autocomplete>` elements. Captures
// every per-stage slice the tick MCFunction needs to drive the three
// entities (editor text, cursor translation, popup text+visibility).
function maybeRecordAutocomplete(
	el: ElementLayout,
	entityY: number,
	entityX: number,
	entityZ: number,
	autocompleteSpecs: AutocompleteSpec[],
): void {
	if (el.kind !== 'autocomplete') return
	autocompleteSpecs.push({
		autoId: el.autoId,
		stageCount: el.stageCount,
		cursorBlink: el.cursorBlink,
		sourceLineCount: el.sourceLineCount,
		popupTriggerColumnBlocks: el.popupTriggerColumnBlocks,
		nbtStageStart: el.nbtStageStart,
		editorDeclarations: el.declarations,
		popupDeclarations: el.declarations,
		popupWidthPxPerStage: el.popupWidthPxPerStage,
		cursorWidthBlocks: el.cursorWidthBlocks,
		cursorHeightBlocks: el.cursorHeightBlocks,
		popupLineHeightBlocks: el.popupLineHeightBlocks,
		popupHeightBlocks: el.popupHeightBlocks,
		popupSegments: el.popupSegments,
		editorContent: el.stages.map((s) => s.editorContent),
		cursorXPerStage: el.stages.map((s) => s.cursorXBlocks),
		cursorYPerStage: el.stages.map((s) => s.cursorYBlocks),
		popupVisiblePerStage: el.stages.map((s) => (s.popupVisible ? -1 : 0)),
		popupSegmentContent: el.stages.map((s) => s.popupSegmentContent),
	})
	// Suppress unused-var lint on entityX/entityY/entityZ — kept on
	// signature so future per-slide tick logic can target the entity by
	// world coords if needed.
	void entityX
	void entityY
	void entityZ
}

export type { Precomputed } from './code-borders'
export type { ElementLayout, ImgResource, ImgResourceMap } from './element'
export { isTextType, isImgType, isVisibleType, resetScrollIds, resetAutocompleteIds } from './element'