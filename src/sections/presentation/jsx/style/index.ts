// Styles — flat selector → declarations map built from LESS, plus a
// path-based resolver that merges every selector matching the JSX path.

import type { CssDeclarations } from '../less/types'
import { LessCollector } from './less-collector'
import { SelectorMatcher } from './selector'

export class Styles {
	private matcher = new SelectorMatcher()
	private cache = new Map<string, CssDeclarations>()

	private constructor(private map: Map<string, CssDeclarations>) {}

	// Build a Styles from LESS source. Parses + flattens, then caches
	// nothing — path lookups happen per-call.
	static async fromLess(lessSource: string): Promise<Styles> {
		const map = await LessCollector.build(lessSource)
		return new Styles(map)
	}

	// Public — kept for callers that already have a map (e.g. tests).
	static fromMap(map: Map<string, CssDeclarations>): Styles {
		return new Styles(map)
	}

	// Merged declarations for a JSX path (root → leaf). Returns a new
	// object each call; safe to mutate.
	forPath(path: string[]): CssDeclarations {
		const segments = path.map((s) => this.matcher.parseCompound(s))
		const out: CssDeclarations = {}
		for (const sel of this.map.keys()) {
			if (this.matcher.selectorMatchesPath(sel, segments)) {
				Object.assign(out, this.map.get(sel)!)
			}
		}
		return out
	}

	// Memoized `forPath` — useful when the same path is resolved many
	// times (e.g. per-slide layout passes).
	forPathCached(path: string[]): CssDeclarations {
		const key = path.join('\x00')
		const cached = this.cache.get(key)
		if (cached) return cached
		const out = this.forPath(path)
		this.cache.set(key, out)
		return out
	}
}