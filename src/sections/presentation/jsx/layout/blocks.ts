// Block grouping + positioning: group consecutive elements that share
// `grid-auto-flow: row` into a single row-flow block; everything else
// stays a single-element block. Computes layout positions per block.

import { parseLength } from '../length'
import type { CssDeclarations } from '../less/types'
import { TEXT_RENDER_OFFSET, getTextDescender } from './constants'
import type { ElementLayout } from './element'

export type Block =
	| { kind: 'element'; el: ElementLayout }
	| { kind: 'row'; parentStack: CssDeclarations; children: ElementLayout[] }

// Walk the elements list, grouping consecutive siblings whose parent
// has `grid-auto-flow: row` into one `row` block.
export function groupIntoBlocks(elements: ElementLayout[]): Block[] {
	const blocks: Block[] = []
	for (let i = 0; i < elements.length; ) {
		const el = elements[i]
		if (el.parentStack?.['grid-auto-flow'] === 'row') {
			const children: ElementLayout[] = []
			while (i < elements.length && elements[i].parentStack === el.parentStack) {
				children.push(elements[i])
				i++
			}
			blocks.push({ kind: 'row', parentStack: el.parentStack, children })
		} else {
			blocks.push({ kind: 'element', el })
			i++
		}
	}
	return blocks
}

export function blockCellH(b: Block): number {
	return b.kind === 'element' ? b.el.cellH : Math.max(...b.children.map((c) => c.cellH))
}

// Gap between two adjacent blocks: parent's `row-gap` (only when both
// share the same parent) + default-font descender buffer.
export function blockGap(prev: Block, next: Block, sceneH: number): number {
	const prevEl = prev.kind === 'element' ? prev.el : prev.children[prev.children.length - 1]
	const nextEl = next.kind === 'element' ? next.el : next.children[0]
	const textDescender =
		prevEl.kind === 'text' && nextEl.kind !== 'text' ? getTextDescender(prevEl.fontId, prevEl.scalePx) : 0
	const prevStack = prev.kind === 'element' ? prev.el.parentStack : prev.parentStack
	const nextStack = next.kind === 'element' ? next.el.parentStack : next.parentStack
	const rowGap =
		prevStack === nextStack
			? parseLength(nextStack['row-gap'] ?? '', sceneH)?.meters ?? 0
			: 0
	return rowGap + textDescender
}

export function totalStackHeight(blocks: Block[], sceneH: number): number {
	return blocks.reduce(
		(sum, b, i) =>
			sum + blockCellH(b) + (i < blocks.length - 1 ? blockGap(b, blocks[i + 1], sceneH) : 0),
		0,
	)
}

export function shouldCenterStack(blocks: Block[]): boolean {
	if (blocks.length === 0) return false
	const first = blocks[0]
	if (first.kind !== 'element') return false
	const stack = first.el.parentStack
	return stack['align-items'] === 'center' && stack['grid-auto-flow'] !== 'row'
}

export function rowDownShift(gap: number, count: number): number {
	if (count <= 1 || gap <= 0) return 0
	return gap * Math.log(count)
}

export function startingY(sceneH: number, totalH: number, blocks: Block[]): number {
	if (!shouldCenterStack(blocks)) return sceneH
	const center = (sceneH + totalH) / 2
	if (blocks.length <= 1) return center

	const firstStack =
		blocks[0].kind === 'element' ? blocks[0].el.parentStack : blocks[0].parentStack
	const rowGap = parseLength(firstStack['row-gap'] ?? '', sceneH)?.meters ?? 0

	return center - rowDownShift(rowGap, blocks.length) + TEXT_RENDER_OFFSET
}