// postcss-selector-parser wrappers. Matches a LESS-style selector
// against a JSX path's tag/id/class compounds, supporting descendant
// and child combinators.

import selectorParser from 'postcss-selector-parser'

type Compound = { tag: string | null; ids: string[]; classes: string[] }
type Parsed = {
	compounds: Array<{ compound: Compound; combinatorBefore: string }>
}

export class SelectorMatcher {
	parseCompound(seg: string): Compound {
		const ast = selectorParser().astSync(seg)
		const sel = ast.first
		if (!sel) return { tag: null, ids: [], classes: [] }
		let tag: string | null = null
		const ids: string[] = []
		const classes: string[] = []
		for (const n of sel.nodes) {
			if (n.type === 'tag') tag = n.value
			else if (n.type === 'id') ids.push(n.value)
			else if (n.type === 'class') classes.push(n.value)
		}
		return { tag, ids, classes }
	}

	parseSelectorFull(sel: string): Parsed {
		const ast = selectorParser().astSync(sel)
		const out: Parsed = { compounds: [] }
		if (!ast.first) return out
		let current: Compound = { tag: null, ids: [], classes: [] }
		let combinator = ''
		for (const n of (ast.first as any).nodes) {
			if (n.type === 'tag') {
				flush(out, current, combinator)
				current = { tag: n.value, ids: [], classes: [] }
				combinator = ' '
			} else if (n.type === 'id') {
				current.ids.push(n.value)
			} else if (n.type === 'class') {
				current.classes.push(n.value)
			} else if (n.type === 'combinator') {
				flush(out, current, combinator)
				current = { tag: null, ids: [], classes: [] }
				combinator = n.value
			}
		}
		flush(out, current, combinator)
		return out
	}

	selectorMatchesPath(sel: string, segments: Compound[]): boolean {
		if (segments.length === 0) return false
		const parsed = this.parseSelectorFull(sel)
		if (parsed.compounds.length === 0) return false
		const targetIdx = segments.length - 1
		const lastIdx = parsed.compounds.length - 1
		if (!this.compoundMatches(parsed.compounds[lastIdx].compound, segments[targetIdx])) return false
		return this.matchAncestors(parsed.compounds, lastIdx - 1, segments, targetIdx - 1)
	}

	private matchAncestors(
		compounds: Parsed['compounds'],
		compoundIdx: number,
		segments: Compound[],
		segIdx: number,
	): boolean {
		if (compoundIdx < 0) return true
		const comb = compounds[compoundIdx + 1].combinatorBefore
		const c = compounds[compoundIdx].compound
		if (comb === '>' || comb === '+') {
			if (segIdx < 0) return false
			if (!this.compoundMatches(c, segments[segIdx])) return false
			return this.matchAncestors(compounds, compoundIdx - 1, segments, segIdx - 1)
		}
		// Descendant: walk up the ancestor chain, accepting any segment
		// that matches the next selector compound.
		for (let i = segIdx; i >= 0; i--) {
			if (
				this.compoundMatches(c, segments[i]) &&
				this.matchAncestors(compounds, compoundIdx - 1, segments, i - 1)
			) {
				return true
			}
		}
		return false
	}

	private compoundMatches(c: Compound, seg: Compound): boolean {
		if (c.tag !== null && c.tag !== '*' && c.tag !== seg.tag) return false
		if (c.ids.length > seg.ids.length) return false
		for (const id of c.ids) if (!seg.ids.includes(id)) return false
		if (c.classes.length > seg.classes.length) return false
		for (const cls of c.classes) if (!seg.classes.includes(cls)) return false
		return true
	}
}

function flush(out: Parsed, c: Compound, combinator: string): void {
	if (c.tag === null && c.ids.length === 0 && c.classes.length === 0) return
	out.compounds.push({ compound: c, combinatorBefore: combinator })
}