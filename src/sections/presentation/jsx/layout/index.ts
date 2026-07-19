// Top-level layout entry: given visible elements + styles + scene
// dimensions, compute per-element layout records + summon every
// entity into MCFunctions emitted to the currently-active callback.
// Each visible VNode carries its ComponentBase instance; the layout
// pass delegates `computeLayout` + `summon` to that class.

import type { LabelClass } from 'sandstone'
import type { NodeWithPath } from '../tree/walk'
import type { VNode } from '../render'
import type { Styles } from '../style'
import {
	type ComponentLayoutBase,
	type LayoutCtx,
	type PrecomputedBag,
	type SummonCtx,
} from '../components/base'
import { type ImgResourceMap } from '../components/image/image-component'
import { blockCellH, blockGap, columnBlockNaturalHeight, groupIntoBlocks, rowDownShift, startingY, totalStackHeight, type Block } from './blocks'
import { TEXT_RENDER_OFFSET, Z_VISUAL_OFFSET, parityOffset } from './constants'
import { parseLength } from '../length'
import type { RowFlexWidth } from './row-flex'

export type Placement = {
	el: ComponentLayoutBase
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
	sceneTag: LabelClass,
	entityTags: (`${any}${string}` | LabelClass)[],
	initialOpacity: number | undefined,
	rowFlexWidths: WeakMap<VNode, RowFlexWidth>,
	precomputedBag: PrecomputedBag,
): { placements: Placement[] } {
	const onSummon = (el: ComponentLayoutBase, x: number, y: number, z: number) => {
		const ctx: SummonCtx = {
			el,
			entityX: x,
			entityY: y,
			z,
			extraTags: entityTags,
			sceneTag,
			initialOpacity,
			...el,
		}
		if (el.component) el.component.summon(ctx)
	}
	return runLayout(visible, styles, sceneW, sceneH, origin, rowFlexWidths, precomputedBag, onSummon)
}

// Layout-only twin of `summonVisibleElements` — no `summon` calls.
// Used during the SlideShow construction pass to discover per-slide
// placement / off-screen issues before any MCFunction is open.
export function computeSlideFrameSpecs(
	visible: NodeWithPath[],
	styles: Styles,
	sceneW: number,
	sceneH: number,
	origin: readonly [number, number, number],
	sceneTag: LabelClass,
	rowFlexWidths: WeakMap<VNode, RowFlexWidth>,
	precomputedBag: PrecomputedBag,
): { placements: Placement[] } {
	return runLayout(visible, styles, sceneW, sceneH, origin, rowFlexWidths, precomputedBag, () => {})
}

type OnSummon = (component: ComponentLayoutBase, x: number, y: number, z: number) => void

function runLayout(
	visible: NodeWithPath[],
	styles: Styles,
	sceneW: number,
	sceneH: number,
	origin: readonly [number, number, number],
	rowFlexWidths: WeakMap<VNode, RowFlexWidth>,
	precomputedBag: PrecomputedBag,
	onComponent: OnSummon,
): { placements: Placement[] } {
	const elements: ComponentLayoutBase[] = visible.map((nodeWithPath) => {
		const component = nodeWithPath.node
		const parentStack =
			nodeWithPath.path.length === 0
				? ({} as Record<string, string>)
				: styles.forPathCached(nodeWithPath.path.slice(0, -1))
		const declarations = styles.forPath(nodeWithPath.path)
		const ctx: LayoutCtx = {
			styles,
			sceneW,
			sceneH,
			node: nodeWithPath,
			declarations,
			parentStack,
			rowFlexWidths,
			precomputedBag,
		}

		const layout = component.computeLayout(ctx)
		// Tag the layout with its owning component so the post-layout
		// finalize pass + summon dispatch back to the right instance.
		layout.component = component
		return layout
	})

	// `<code>` / `<explorer>` (scrollable) start with `cellH = 0`
	// placeholder; the layout engine sizes them to fill remaining
	// slide space. After sizing, call each component's `finalizeLayout`
	// to bake viewport chunks based on the final cellH. Prose +
	// autocomplete compute their own cellH and are not resized here.
	const blocks0 = groupIntoBlocks(elements)
	const nonScrollH = simulateStackAdvance(blocks0, sceneH)
	const remaining = Math.max(2, sceneH - nonScrollH)
	for (const block of blocks0) {
		const animatedEls: ComponentLayoutBase[] =
			block.kind === 'element'
				? block.el.kind === 'text' && block.el.cellH === 0
					? [block.el]
					: []
				: (block.children as ComponentLayoutBase[]).filter(
						(c) => c.kind === 'text' && c.cellH === 0,
				  )
		if (animatedEls.length === 0) continue
		for (const el of animatedEls) {
			el.cellH = remaining
			if (el.component?.finalizeLayout) {
				el.component.finalizeLayout(el)
			}
		}
	}

	const blocks = groupIntoBlocks(elements)
	const totalH = totalStackHeight(blocks, sceneH)
	let accY = startingY(sceneH, totalH, blocks)
	const z = origin[2] + Z_VISUAL_OFFSET

	const placements: Placement[] = []
	for (let bi = 0; bi < blocks.length; bi++) {
		const block = blocks[bi]
		if (block.kind === 'element') {
			const el = block.el
			const cellY = origin[1] + accY - el.marginTop - el.cellH + parityOffset(sceneH)
			const entityY =
				el.kind === 'text'
					? cellY - TEXT_RENDER_OFFSET
					: el.kind === 'image'
						? cellY + el.cellH / 2
						: cellY - TEXT_RENDER_OFFSET

			const entityX = origin[0] + sceneW / 2
			onComponent(el, entityX, entityY, z)
			placements.push({ el, x: entityX, y: entityY, z })
			accY -= el.marginTop + el.cellH
			if (bi < blocks.length - 1) {
				accY -= blockGap(block, blocks[bi + 1], sceneH) + el.marginBottom
			}
		} else if (block.kind === 'row') {
			accY = placeRowBlocks(
				block, accY, sceneW, sceneH, origin, z,
				rowFlexWidths, placements, onComponent,
			)
			if (bi < blocks.length - 1) {
				const lastChild = block.children[block.children.length - 1]
				accY -= blockGap(block, blocks[bi + 1], sceneH) + lastChild.marginBottom
			}
		} else {
			accY = placeColumnBlocks(
				block, accY, sceneW, sceneH, origin, z,
				rowFlexWidths, placements, onComponent,
			)
			if (bi < blocks.length - 1) {
				const lastChild = block.children[block.children.length - 1]
				accY -= blockGap(block, blocks[bi + 1], sceneH) + lastChild.marginBottom
			}
		}
	}
	return { placements }
}

// Layout-only twin of `summonVisibleElements` — no `summon` calls.
// (Already defined above; this stub is intentionally left empty.)


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

function placeRowBlocks(
	block: Extract<Block, { kind: 'row' }>,
	accY: number,
	sceneW: number,
	sceneH: number,
	origin: readonly [number, number, number],
	z: number,
	rowFlexWidths: WeakMap<VNode, RowFlexWidth>,
	placements: Placement[],
	onComponent: OnSummon,
): number {
	void rowFlexWidths
	const columnGap = parseLength(block.parentStack['column-gap'] ?? '', sceneW)?.meters ?? 0
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
		workingY = 0
	} else {
		workingY -= containerCellH
	}
	if (bottomAnchored) {
		workingY += TEXT_RENDER_OFFSET
	} else {
		workingY -= rowDownShift(columnGap, block.children.length)
	}
	const containerCenterY = origin[1] + workingY + containerCellH / 2
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
		const entityY =
			child.kind === 'text'
				? subCellY - TEXT_RENDER_OFFSET
				: child.kind === 'image'
					? subCellY + child.cellH / 2
					: subCellY - TEXT_RENDER_OFFSET
		onComponent(child, childCenterX, entityY, z)
		placements.push({ el: child, x: childCenterX, y: entityY, z })
		accX += child.cellW + columnGap
	}
	return workingY
}

function placeColumnBlocks(
	block: Extract<Block, { kind: 'column' }>,
	accY: number,
	sceneW: number,
	sceneH: number,
	origin: readonly [number, number, number],
	z: number,
	rowFlexWidths: WeakMap<VNode, RowFlexWidth>,
	placements: Placement[],
	onComponent: OnSummon,
): number {
	void rowFlexWidths
	const rowGap = parseLength(block.parentStack['row-gap'] ?? '', sceneH)?.meters ?? 0
	const heightProp = block.parentStack.height
	const pctMatch = heightProp?.trim().match(/^(-?\d*\.?\d+)\s*%$/i)
	const naturalH = columnBlockNaturalHeight(block, sceneH)
	const heightMeters = pctMatch
		? (parseFloat(pctMatch[1]) / 100) * accY
		: (parseLength(heightProp ?? '', sceneH)?.meters ?? 0)
	const containerCellH = Math.max(naturalH, heightMeters)
	const topPadding = Math.max(0, (containerCellH - naturalH) / 2)
	const centerX = origin[0] + sceneW / 2
	let workingY = accY - topPadding
	for (const child of block.children) {
		workingY -= child.marginTop
		const cellY = origin[1] + workingY - child.cellH + parityOffset(sceneH)
		const entityY =
			child.kind === 'text'
				? cellY - TEXT_RENDER_OFFSET
				: child.kind === 'image'
					? cellY + child.cellH / 2
					: cellY - TEXT_RENDER_OFFSET
		onComponent(child, centerX, entityY, z)
		placements.push({ el: child, x: centerX, y: entityY, z })
		workingY -= child.cellH + rowGap
	}
	return accY - containerCellH
}