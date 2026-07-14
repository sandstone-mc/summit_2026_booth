// Block grouping + positioning: group consecutive elements that share
// `grid-auto-flow: row` into a single row-flow block; everything else
// stays a single-element block. Computes layout positions per block.

import { parseLength } from '../length'
import type { CssDeclarations } from '../less/types'
import { getTextDescender } from './constants'
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

// Should the slide's stack of blocks be vertically centered, rather than
// top-down from the slide's bottom edge?
//
// Convention in this codebase: a `<div>` wrapper with `align-items: center`
// (and no `grid-auto-flow: row`) acts as a "center this content in the
// slide" wrapper — the user overloads the CSS `align-items` property
// because there's no other way to express slide-level centering. See
// `#text-grid` in `styles.less` for the canonical use.
//
// Row containers (`grid-auto-flow: row`) size themselves via their own
// `height` rule (e.g. `#img-grid { height: 100% }`) and never trigger
// slide-level centering — the row fills the available space and the
// caller is responsible for its internal positioning.
export function shouldCenterStack(blocks: Block[]): boolean {
	if (blocks.length === 0) return false
	const first = blocks[0]
	if (first.kind !== 'element') return false
	const stack = first.el.parentStack
	return stack['align-items'] === 'center' && stack['grid-auto-flow'] !== 'row'
}

// Non-linear downward shift applied to a centered stack (or row block)
// that has more than one child. The natural log returns 0 at count = 1,
// guaranteeing a single element is never moved (so a lone `<h1>` stays
// dead-center regardless of the parent's gap). `gap` is whichever axis
// spacing governs the layout: row-gap for vertical stacks, column-gap
// for horizontal rows. `gap = 0` collapses to 0 regardless of count, so
// LESS without an explicit gap never shifts.
export function rowDownShift(gap: number, count: number): number {
	if (count <= 1 || gap <= 0) return 0
	return gap * Math.log(count)
}

// Starting Y position for the slide's content stack. Always the slide
// bottom by default; slide-level centering (see `shouldCenterStack`) lifts
// the stack so its midpoint aligns with the slide's vertical midpoint.
//
// Multi-block centered stacks are nudged down by a non-linear function
// of `(blocks.length, rowGap)` so each subsequent element doesn't pile
// up against the slide's visual top — the previous slide's heading
// establishes where the eye expects "content" to begin, and a pure
// centered formula leaves multi-paragraph stacks hovering too high.
// `ln(blocks.length)` is the natural non-linear scaling: it equals 0
// at `blocks.length === 1` (so single-element headings like a lone
// `<h1>` stay dead-center) and grows as more elements join the stack.
// `rowGap` is the row spacing of the owning parent — we sum only the
// `prev→next` gaps whose parentStack reference actually matches the
// first block's parent, so the shift reflects this slide's real
// inter-element spacing rather than always picking the first rowGap.
export function startingY(sceneH: number, totalH: number, blocks: Block[]): number {
	if (!shouldCenterStack(blocks)) return sceneH
	const center = (sceneH + totalH) / 2
	if (blocks.length <= 1) return center
	// Single representative row-gap for the parent of this stack —
	// pulled from the first block's parent declarations so a row-gap
	// change in LESS flows through automatically.
	const firstStack =
		blocks[0].kind === 'element' ? blocks[0].el.parentStack : blocks[0].parentStack
	const rowGap = parseLength(firstStack['row-gap'] ?? '', sceneH)?.meters ?? 0
	// Non-linear scaling: ln(n) is exactly 0 at n=1, so single-element
	// headings stay dead-center regardless of row-gap. As elements
	// join the stack, the natural log gives a diminishing per-element
	// shift (4 elements shift 1.39× a single row-gap, 10 shift 2.30×).
	return center - rowDownShift(rowGap, blocks.length)
}