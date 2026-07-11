// Block grouping + positioning: group consecutive elements that share
// `grid-auto-flow: row` into a single row-flow block; everything else
// stays a single-element block. Computes layout positions per block.

import { parseLength } from '../length'
import type { CssDeclarations } from '../less/types'
import { TEXT_DESCENDER } from './constants'
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
// share the same parent) + 1-block text descender buffer.
export function blockGap(prev: Block, next: Block, sceneH: number): number {
	const prevEl = prev.kind === 'element' ? prev.el : prev.children[prev.children.length - 1]
	const nextEl = next.kind === 'element' ? next.el : next.children[0]
	const textDescender = prevEl.kind === 'text' && nextEl.kind !== 'text' ? TEXT_DESCENDER : 0
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

// Starting Y position: sceneH (bottom of scene) for default top-down
// stacking; centered for `align-items: center`.
export function startingY(sceneH: number, totalH: number, stackDecs: CssDeclarations): number {
	return stackDecs['align-items'] === 'center' ? (sceneH + totalH + 1) / 2 : sceneH
}