// Walks a LESS AST and flattens rulesets into a selector → declarations
// map. `&` in nested rulesets expands against the enclosing selector chain.

import type {
	LessRulesetNode,
	LessSelectorNode,
	LessElementNode,
	LessTreeNode,
	CssDeclarations,
} from '../less/types'

export class LessCollector {
	private into: Map<string, CssDeclarations> = new Map()

	// Build the Styles map from raw LESS source. Returns the collector
	// pre-populated; call `.map` to get the flat selector → declarations
	// map for `Styles.forPath()`.
	static async build(lessSource: string): Promise<Map<string, CssDeclarations>> {
		const c = new LessCollector()
		if (!lessSource.trim()) return c.into
		const { parse } = await import('../less')
		const ast = await parse(lessSource)
		c.collect(ast, [])
		return c.into
	}

	get map(): Map<string, CssDeclarations> {
		return this.into
	}

	collect(node: LessTreeNode | null | undefined, parentSelectors: string[]): void {
		if (!node) return
		if (node.type === 'Ruleset') {
			const ruleset: LessRulesetNode = node
			const mySelectors = this.expand(ruleset.selectors ?? [], parentSelectors)
			if (mySelectors.length > 0) {
				const declarations: CssDeclarations = {}
				for (const rule of ruleset.rules ?? []) {
					if (rule.type === 'Declaration') {
						// `name` is Keyword[] for property decls, `@name`
						// string for variable decls. `value` may be a
						// primitive OR an Expression (hex colors) — prefer
						// `toCSS({})` for the canonical CSS form.
						const name = Array.isArray(rule.name) ? rule.name[0]?.value : rule.name
						if (typeof name === 'string') {
							const v = rule.value
							let resolved: unknown
							if (typeof v?.toCSS === 'function') resolved = v.toCSS({})
							else if (typeof v?.value === 'string' || typeof v?.value === 'number') resolved = v.value
							else resolved = v
							declarations[name] = String(resolved)
						}
					}
				}
				for (const sel of mySelectors) {
					this.into.set(sel, { ...(this.into.get(sel) ?? {}), ...declarations })
				}
			}
			for (const child of ruleset.rules ?? []) {
				this.collect(child, mySelectors)
			}
			return
		}
		// Other rule-bearing containers: descend into `.rules` and
		// inherit the parent chain (`@media` body still needs `&` to
		// expand against the enclosing ruleset's selector).
		if (node.type === 'Media' || node.type === 'MixinDefinition' || node.type === 'AtRule') {
			for (const child of node.rules ?? []) this.collect(child, parentSelectors)
		}
	}

	private expand(selectors: LessSelectorNode[], parentSelectors: string[]): string[] {
		if (selectors.length === 0) return []
		if (parentSelectors.length === 0) {
			return selectors.map((s) => this.formatTopLevel(s))
		}
		return selectors.flatMap((child) => parentSelectors.map((p) => this.formatWithParent(child, p)))
	}

	// `+` binds tighter than `??` — always parenthesize the combinator
	// + element-value concatenation. Without parens the precedence drop
	// returns just the combinator string and discards `el.value`.
	private formatTopLevel(s: LessSelectorNode): string {
		return (s.elements ?? []).map((e) => `${e.combinator?.value ?? ''}${e.value ?? ''}`).join('')
	}

	private formatWithParent(child: LessSelectorNode, parent: string): string {
		const elements: LessElementNode[] = child.elements ?? []
		let result = ''
		let firstConsumed = false
		for (const el of elements) {
			const comb = el.combinator?.value ?? ''
			const isAmp = el.value === '&' || el.value === null
			if (isAmp && !firstConsumed) {
				// Leading `&` absorbs into the prefix; no leading combinator.
				result = parent
				firstConsumed = true
			} else {
				result += comb + (isAmp ? parent : el.value ?? '')
			}
		}
		return result
	}
}