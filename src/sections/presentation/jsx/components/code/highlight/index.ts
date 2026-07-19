// Public highlight API. Wraps `Highlighter` + pre-computation helper.

import type { StyledSegment } from '../../../render'
import type { Grammar } from './highlighter'
import { Highlighter } from './highlighter'

export type { Grammar } from './highlighter'

export async function loadHighlighter(registry: Record<string, Grammar>): Promise<Highlighter> {
	return Highlighter.create(registry)
}

// Pre-tokenize every distinct (source, lang) pair in `requests`, dedup
// by `lang\x00source` key. Returns a lookup fn backed by a Map.
export async function precomputeHighlights(
	registry: Record<string, Grammar>,
	requests: Array<{ source: string; lang: string }>,
): Promise<(source: string, lang: string) => StyledSegment[] | null> {
	const highlighter = await Highlighter.create(registry)

	const seen = new Map<string, StyledSegment[] | null>()
	const unique: Array<{ source: string; lang: string }> = []
	for (const { source, lang } of requests) {
		const key = `${lang}\x00${source}`
		if (seen.has(key)) continue
		seen.set(key, null)
		unique.push({ source, lang })
	}
	const results = await Promise.all(
		unique.map(async ({ source, lang }) => {
			const segs = await highlighter.highlight(source, lang)
			return { source, lang, segs }
		}),
	)
	for (const { source, lang, segs } of results) {
		seen.set(`${lang}\x00${source}`, segs.length ? segs : null)
	}

	return (source, lang) => seen.get(`${lang}\x00${source}`) ?? null
}