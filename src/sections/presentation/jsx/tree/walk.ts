// VNode tree helpers — walk, classify, and stringify JSX children.

import { Fragment } from '../jsx-runtime'
import type { VNode } from '../render'

export function isVNode(x: any): x is VNode {
	return x != null && typeof x === 'object' && 'type' in x && 'props' in x
}

// Flatten nested children into a single array, dropping nulls/false.
export function flattenChildren(children: any): any[] {
	if (children == null || children === false) return []
	if (Array.isArray(children)) return children.flatMap(flattenChildren)
	return [children]
}

export type NodeWithPath = { node: VNode; path: string[] }

// Build a CSS-like selector string for a VNode: tag + #id + .class.
export function nodeSelector(node: VNode): string {
	const tag = String(node.type)
	const id = node.props?.id ? `#${node.props.id}` : ''
	const cls = node.props?.class ? `.${node.props.class}` : ''
	return tag + id + cls
}

// Walk a VNode tree, returning each visible VNode with the
// tag#id.class path of every ancestor. Unwraps function components
// and Fragments — keeps walking the resolved tree.
export function flatWalk(root: VNode): NodeWithPath[] {
	const out: NodeWithPath[] = []

	function walkNode(node: VNode, path: string[]) {
		let cur: any = node
		while (typeof cur?.type === 'function') {
			const result = cur.type(cur.props ?? {})
			if (Array.isArray(result)) {
				for (const c of result) if (isVNode(c)) walkNode(c, path)
				return
			}
			cur = result
		}

		const sel = nodeSelector(cur)
		const myPath = [...path, sel]
		out.push({ node: cur, path: myPath })

		for (const child of flattenChildren(cur.props?.children)) {
			if (isVNode(child)) walkNode(child, myPath)
		}
	}

	walkNode(root, [])
	return out
}

// Marker comments that delimit a snippet inside a larger source file.
// Useful when the imported file has imports / placeholders around the
// actual snippet — the renderer pulls only the lines between markers.
export const SNIPPET_START = '// == snippet start =='
export const SNIPPET_END = '// == snippet end =='