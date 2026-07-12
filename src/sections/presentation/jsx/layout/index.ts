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
import type { VNode } from '../render'
import type { Styles } from '../style'
import { computeElementLayout, type ElementLayout, type ImgResourceMap } from './element'
import type { Precomputed } from './code-borders'
import { blockCellH, blockGap, groupIntoBlocks, startingY, totalStackHeight, type Block } from './blocks'
import { summonElement } from './summon-entity'
import { Z_VISUAL_OFFSET } from './constants'

export type CodePrecomputedMap = WeakMap<VNode, Precomputed>

/** Spec captured during layout, consumed by the slide's scroll-tick. */
export type ScrollSpec = {
	/** Unique tag set on every chunk entity at summon time. */
	scrollTag: string
	/** Entity's initial Y in world blocks (cellY - 1). */
	startY: number
	/** Total scroll distance in world blocks (positive). */
	scrollDistBlocks: number
	/** Height of one visual line in blocks — drives the TUI line-step. */
	lineHeightBlocks: number
	/** Number of viewport-sized chunks the scroll block was split into. */
	chunkCount: number
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
): { scrollSpecs: ScrollSpec[] } {
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
): ScrollSpec[] {
	return runLayout(
		visible,
		styles,
		sceneW,
		sceneH,
		origin,
		codePrecomputed,
		imgResources,
		() => {},
	).scrollSpecs
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
): { scrollSpecs: ScrollSpec[] } {
	const elements: ElementLayout[] = visible.map((nodeWithPath) =>
		computeElementLayout(nodeWithPath, styles, sceneW, sceneH, imgResources, codePrecomputed),
	)

	const blocks = groupIntoBlocks(elements)
	const totalH = totalStackHeight(blocks, sceneH)
	const stackDecs = elements[0]?.parentStack ?? {}
	let accY = startingY(sceneH, totalH, stackDecs)
	const z = origin[2] + Z_VISUAL_OFFSET

	const scrollSpecs: ScrollSpec[] = []
	for (let bi = 0; bi < blocks.length; bi++) {
		const block = blocks[bi]
		if (block.kind === 'element') {
			const el = block.el
			const cellY = origin[1] + accY - el.marginTop - el.cellH
			const entityX = origin[0] + sceneW / 2
			onElement(el, entityX, cellY, z)
			maybeRecordScroll(el, cellY - 1, scrollSpecs)
			accY -= el.marginTop + el.cellH
			if (bi < blocks.length - 1) {
				accY -= blockGap(block, blocks[bi + 1], sceneH) + el.marginBottom
			}
		} else {
			accY = placeRowBlocks(block, accY, sceneW, sceneH, origin, z, onElement, scrollSpecs)
			if (bi < blocks.length - 1) {
				const lastChild = block.children[block.children.length - 1]
				accY -= blockGap(block, blocks[bi + 1], sceneH) + lastChild.marginBottom
			}
		}
	}
	return { scrollSpecs }
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
		onElement(child, childCenterX, subCellY, z)
		maybeRecordScroll(child, subCellY - 1, scrollSpecs)
		accX += child.cellW + columnGap
	}

	return workingY
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
		lineHeightBlocks: pxToTextLineHeight(el.scalePx),
		chunkCount: el.chunkCount ?? 1,
	})
}

export type { Precomputed } from './code-borders'
export type { ElementLayout, ImgResource, ImgResourceMap } from './element'
export { isTextType, isImgType, isVisibleType, resetScrollIds } from './element'