// LESS compile + parse wrappers. Types live in `./types`.

import less from 'less'
import type { LessTreeNode, LessTree } from './types'

export * from './types'

// Compile LESS source → CSS string. Resolves @import, variables, mixins.
export async function compile(lessSource: string): Promise<string> {
	const out = await less.render(lessSource)
	return out.css
}

// Parse LESS → AST. Used by the resolver to match selectors against
// JSX elements at build time.
export async function parse(lessSource: string): Promise<LessTreeNode> {
	return less.parse(lessSource)
}

// Re-export tree node constructors so consumers can build/inspect ASTs.
export const tree: LessTree = less.tree