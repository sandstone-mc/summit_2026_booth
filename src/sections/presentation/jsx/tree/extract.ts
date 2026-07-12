// Text + code-source extraction from a JSX children subtree.

import type { VNode } from '../render'
import { SNIPPET_END, SNIPPET_START, isVNode } from './walk'

// Recursively extract a plain string from a children tree: strings,
// numbers, function-toString, nested VNodes (recurse on their children),
// arrays joined together. Voids false / null.
export function extractText(children: any): string {
	if (children == null || children === false) return ''
	if (typeof children === 'string' || typeof children === 'number') return String(children)
	if (typeof children === 'function') return codeSourceFromFunction(children)
	if (isVNode(children)) return extractText(children.props?.children)
	if (Array.isArray(children)) return children.map(extractText).join('')
	return ''
}

// Pull the body of an arrow / regular function back out as a string.
// Strips the `() => { … }` wrapper, dedents the body, trims leading /
// trailing blank lines. Lets users keep code snippets type-checked.
export function codeSourceFromFunction(fn: Function): string {
	const src = fn.toString()
	const open = src.indexOf('{')
	const close = src.lastIndexOf('}')
	if (open === -1 || close === -1 || close <= open) return src
	let body = src.slice(open + 1, close)
	body = dedentBlock(body)
	body = body.replace(/^\n+/, '').replace(/\n[ \t]*$/, '')
	return body
}

// Remove the longest common leading whitespace from every non-blank line.
export function dedentBlock(s: string): string {
	const lines = s.split('\n')
	let common: number | null = null
	for (const line of lines) {
		if (!line.trim()) continue
		const lead = line.match(/^[ \t]*/)?.[0].length ?? 0
		if (common === null) common = lead
		else common = Math.min(common, lead)
		if (common === 0) break
	}
	if (!common) return s
	return lines.map((l) => l.slice(common!)).join('\n')
}

// Resolve a `<code>` element's source. `src` prop (Bun `with { type: 'text' }`)
// wins. Otherwise children can be a string, a function, or an array of
// any of those (joined). Strips `// == snippet start/end ==` markers
// when present, returning only the lines between them.
export function extractCodeSource(props: any): string {
	let src: string
	if (typeof props?.src === 'string') {
		src = props.src
	} else {
		const child = props?.children
		if (typeof child === 'string') src = child
		else if (typeof child === 'function') src = codeSourceFromFunction(child)
		else if (Array.isArray(child)) src = child.map(extractCodeSource).join('')
		else return ''
	}

	const startIdx = src.indexOf(SNIPPET_START)
	const endIdx = src.indexOf(SNIPPET_END)
	if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
		const afterStart = src.indexOf('\n', startIdx)
		if (afterStart !== -1) {
			const inner = src.slice(afterStart + 1, endIdx)
			return dedentBlock(inner).replace(/\n+$/, '').replace(/\t/g, '    ')
		}
	}
	return src.replace(/\t/g, '    ')
}