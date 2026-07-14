// Top-level layout entry: given visible elements + styles + scene
// dimensions, summon every entity into MCFunctions emitted to the
// currently-active callback. Internally:
//   1. computeElementLayout → per-element layout records
//   2. groupIntoBlocks → split into single-element blocks + row-flow blocks
//   3. iterate blocks, compute positioning, summon each entity
//
// The placement pass is shared with `computeSlideScrollSpecs`, which
// runs the same math without emitting any `summon` commands — letting
// the slide show build its scroll-tick MCFunctions ahead of mount.

import { parseLength, pxToTextLineHeight } from '../length'
import type { LabelClass } from 'sandstone'
import type { NodeWithPath } from '../tree/walk'
import type { VNode, StyledSegment } from '../render'
import type { Styles } from '../style'
import type { CssDeclarations } from '../less/types'
import { computeElementLayout, finalizeScrollCodeLayout, type ElementLayout, type ImgResourceMap } from './element'
import type { Precomputed } from './code-borders'
import { blockCellH, blockGap, groupIntoBlocks, rowDownShift, startingY, totalStackHeight, type Block } from './blocks'
import { summonElement } from './summon-entity'
import { Z_VISUAL_OFFSET, getTextDescender } from './constants'

export type CodePrecomputedMap = WeakMap<VNode, Precomputed>

/** Spec captured during layout, consumed by the slide's scroll-tick. */
export type ScrollSpec = {
	/** Unique tag set on the (single) scroll entity at summon time. */
	scrollTag: string
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
): { scrollSpecs: ScrollSpec[]; placements: Placement[] } {
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
	)
}

/**
 * Layout-only twin of `summonVisibleElements`. Runs the placement math
 * without emitting any `summon` commands — used during SlideShow
 * construction to collect per-slide scroll specs before any MCFunction
 * is built.
 */
export function computeSlideScrollSpecs(
	visible: NodeWithPath[],
	styles: Styles,
	sceneW: number,
	sceneH: number,
	origin: readonly [number, number, number],
	codePrecomputed: CodePrecomputedMap,
	imgResources: ImgResourceMap,
): { scrollSpecs: ScrollSpec[]; placements: Placement[] } {
	return runLayout(
		visible,
		styles,
		sceneW,
		sceneH,
		origin,
		codePrecomputed,
		imgResources,
		() => {},
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
): { scrollSpecs: ScrollSpec[]; placements: Placement[] } {
	const elements: ElementLayout[] = visible.map((nodeWithPath) =>
		computeElementLayout(nodeWithPath, styles, sceneW, sceneH, imgResources, codePrecomputed),
	)

	// Scrolling `<code>` blocks start with `cellH = 0` placeholder; the
	// layout engine sizes them to fill remaining slide space after other
	// elements are placed. Measure the non-scroll stack first by simulating
	// `accY` advance (margins + gaps + row block heights included), divide
	// the remaining space across scroll elements, then rebuild chunks.
	const blocks0 = groupIntoBlocks(elements)
	const nonScrollH = simulateStackAdvance(blocks0, sceneH)
	const scrollEls = elements.filter(
		(el) => el.kind === 'text' && typeof el.scrollTag === 'string',
	)
	// Each scroll element takes the full remaining space (equal split
	// when more than one). Clamp to ≥ 2 blocks so the box stays
	// non-degenerate if other elements overflow.
	const remaining = Math.max(2, sceneH - nonScrollH)
	const perScrollCellH = remaining / Math.max(1, scrollEls.length)
	for (const el of scrollEls) {
		el.cellH = perScrollCellH
		finalizeScrollCodeLayout(el)
	}

	const blocks = groupIntoBlocks(elements)
	const totalH = totalStackHeight(blocks, sceneH)
	let accY = startingY(sceneH, totalH, blocks)
	const z = origin[2] + Z_VISUAL_OFFSET

	const placements: Placement[] = []
	const scrollSpecs: ScrollSpec[] = []
	for (let bi = 0; bi < blocks.length; bi++) {
		const block = blocks[bi]
		if (block.kind === 'element') {
			const el = block.el
			const cellY = origin[1] + accY - el.marginTop - el.cellH + (sceneH % 2 === 0 ? 0 : 0.5)
			// Entity Y depends on element kind:
			//   scroll `<code>`:  cellY (bottom border flush with slide bottom)
			//   prose/h/code:     cellY (bottom-center anchor; glyph grows up)
			//   image:            cellY + cellH / 2 (image is centered in cell)
			const entityY =
				el.kind === 'text' && typeof el.scrollTag === 'string'
					? cellY
					: el.kind === 'image'
						? cellY + el.cellH / 2
						: cellY

			const entityX = origin[0] + sceneW / 2
			onElement(el, entityX, entityY, z)
			placements.push({ el, x: entityX, y: entityY, z })
			maybeRecordScroll(el, entityY, scrollSpecs)
			accY -= el.marginTop + el.cellH
			if (bi < blocks.length - 1) {
				accY -= blockGap(block, blocks[bi + 1], sceneH) + el.marginBottom
			}
		} else {
			accY = placeRowBlocks(
				block,
				accY,
				sceneW,
				sceneH,
				origin,
				z,
				onElement,
				scrollSpecs,
				placements,
			)
			if (bi < blocks.length - 1) {
				const lastChild = block.children[block.children.length - 1]
				accY -= blockGap(block, blocks[bi + 1], sceneH) + lastChild.marginBottom
			}
		}
	}
	return { scrollSpecs, placements }
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
	// Pull the row down when the parent container has multiple children
	// and a non-zero column-gap — same shape as the vertical-stack
	// adjustment in `startingY`. `rowDownShift` returns 0 for single-
	// child rows and for parents that declared no column-gap, so a
	// lone `<img>` in a row container is unaffected.
	workingY -= rowDownShift(columnGap, block.children.length)
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
		const entityY =
			child.kind === 'text' && typeof child.scrollTag === 'string'
				? subCellY
				: child.kind === 'image'
					? subCellY + child.cellH / 2
					: subCellY
		onElement(child, childCenterX, entityY, z)
		placements.push({ el: child, x: childCenterX, y: entityY, z })
		maybeRecordScroll(child, entityY, scrollSpecs)
		accX += child.cellW + columnGap
	}

	return workingY
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
		} else {
			accY -= blockCellH(b)
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

export type { Precomputed } from './code-borders'
export type { ElementLayout, ImgResource, ImgResourceMap } from './element'
export { isTextType, isImgType, isVisibleType, resetScrollIds } from './element'