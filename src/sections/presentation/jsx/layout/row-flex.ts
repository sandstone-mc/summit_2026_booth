// Row-aware flex width resolution for `grid-auto-flow: row` containers.
//
// In a row block, children whose LESS-declared `width` is a percentage
// (or vw) of the parent axis share the leftover horizontal space equally
// among themselves, after fixed-size siblings claim their share. This
// matches the CSS Grid intuition that `width: 100%` on a row child means
// "100% of the available row space" (i.e. `1/n` of the scene width for
// an n-child row), not "100% of the slide's full width".
//
// Runs as a synchronous pre-pass before `prepareCodeHighlights` and
// `computeElementLayout`, so the resolved width is in place by the time
// code borders are built and `cellW` is computed. Both consumers read
// the same `WeakMap<VNode, { widthPx, widthMeters }>` to override their
// raw LESS-declared width.

import { parseLength } from '../length'
import type { Styles } from '../style'
import type { VNode } from '../render'
import type { NodeWithPath } from '../tree/walk'
import type { CssDeclarations } from '../less/types'

export type RowFlexWidth = { widthPx: number; widthMeters: number }

export function prepareRowFlexWidths(
	visiblePerSlide: readonly NodeWithPath[][],
	styles: Styles,
	sceneW: number,
): WeakMap<VNode, RowFlexWidth> {
	const overrides: WeakMap<VNode, RowFlexWidth> = new WeakMap()
	for (const visible of visiblePerSlide) {
		// Resolve parentStack once per visible element. Mirrors the lookup
		// `computeElementLayout` does, but without building a full layout.
		// Reference equality of the returned CssDeclarations lets us group
		// siblings that share the same parent (root-level elements all get
		// fresh empty `{}` objects, so they never qualify — same as the
		// in-layout `groupIntoBlocks`).
		type Stacked = { node: VNode; path: string[]; parentStack: CssDeclarations }
		const stacked: Stacked[] = visible.map(({ node, path }) => ({
			node,
			path,
			parentStack:
				path.length === 0 ? ({} as CssDeclarations) : styles.forPathCached(path.slice(0, -1)),
		}))

		let i = 0
		while (i < stacked.length) {
			const first = stacked[i]
			if (first.parentStack['grid-auto-flow'] !== 'row') {
				i++
				continue
			}
			const rowStart = i
			while (i < stacked.length && stacked[i].parentStack === first.parentStack) i++
			resolveRowFlexWidths(stacked.slice(rowStart, i), styles, sceneW, overrides)
		}
	}
	return overrides
}

function resolveRowFlexWidths(
	rowChildren: readonly { node: VNode; path: string[] }[],
	styles: Styles,
	sceneW: number,
	overrides: WeakMap<VNode, RowFlexWidth>,
): void {
	const parentStack = styles.forPath(rowChildren[0].path.slice(0, -1))
	const columnGap = parseLength(parentStack['column-gap'] ?? '', sceneW)?.meters ?? 0
	const gaps = Math.max(0, rowChildren.length - 1) * columnGap

	// Classify each child as flex or fixed by inspecting its width. The
	// JSX `width` prop wins over LESS `width` (explicit user intent) —
	// matches `<img>`'s prop-vs-LESS resolution. Only `%` is a flex unit
	// (CSS Grid "share of parent axis"). `vw`/`vh` are absolute — they're
	// measured against the viewport (= sceneW/sceneH), not the parent,
	// so they must NOT be redistributed among siblings.
	const flexChildren: { node: VNode }[] = []
	let fixedSum = 0
	for (const child of rowChildren) {
		const declarations = styles.forPath(child.path)
		// JSX prop width takes priority over LESS — see `<img>`'s
		// `widthRaw` resolution in `computeImgLayout`.
		const widthRaw =
			(typeof child.node.props?.width === 'string' && child.node.props.width) ||
			declarations.width ||
			''
		const width = parseLength(widthRaw, sceneW)
		if (width && width.unit === '%') {
			flexChildren.push({ node: child.node })
			continue
		}
		// No flex width (or absolute width like `vw`/`vh`/`px`) —
		// contributes its actual meters, or sceneW as the natural
		// fallback when unset (matches `computeTextLayout`'s default
		// for `<code>` / `<explorer>` without a width).
		fixedSum += width?.meters ?? sceneW
	}

	if (flexChildren.length === 0) return
	const flexRoom = Math.max(0, sceneW - fixedSum - gaps)
	const perFlex = flexRoom / flexChildren.length
	for (const child of flexChildren) {
		overrides.set(child.node, { widthPx: perFlex * 16, widthMeters: perFlex })
	}
}