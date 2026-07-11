// Tag sweep over highlighted source positions → flat StyledSegment[].
// Lower priority wins; ties broken by larger range.

import type { StyledSegment } from '../render'

const CATEGORY_ORDER = [
	'comment',
	'string',
	'function',
	'type',
	'preproc',
	'constant',
	'boolean',
	'number',
	'keyword',
	'tag',
	'embedded',
	'variable',
	'attribute',
	'property',
	'constructor',
	'punctuation',
	'operator',
	'emphasis',
] as const

const PROMOTED: ReadonlySet<string> = new Set([
	'string.escape',
	'string.regex',
	'string.special',
	'punctuation.special',
	'constant.character.escape',
	'tag.component.jsx',
])
const PROMOTED_PRIORITY = 50

type Tag = { start: number; end: number; priority: number; name: string; color: `#${string}` }

export class Tokenizer {
	private order = CATEGORY_ORDER

	priorityOf(name: string): number {
		if (PROMOTED.has(name)) return PROMOTED_PRIORITY
		const parts = name.split('.')
		const catIdx = this.order.indexOf(parts[0] as (typeof CATEGORY_ORDER)[number])
		const cat = catIdx === -1 ? this.order.length : catIdx
		return cat * 100 - parts.length
	}

	// Push `text` onto `out`, merging into the previous segment when colors match.
	private push(out: StyledSegment[], text: string, color: `#${string}` | undefined): void {
		if (!text) return
		const last = out[out.length - 1]
		if (last && last.color === color) {
			last.text += text
			return
		}
		const seg: StyledSegment = { text }
		if (color !== undefined) seg.color = color
		out.push(seg)
	}

	private pickWinner(active: Tag[]): Tag | undefined {
		if (active.length === 0) return undefined
		let winner = active[0]
		for (let i = 1; i < active.length; i++) {
			const t = active[i]
			if (t.priority < winner.priority) {
				winner = t
			} else if (t.priority === winner.priority && t.end - t.start > winner.end - winner.start) {
				winner = t
			}
		}
		return winner
	}

	collapseToSegments(source: string, tags: Tag[]): StyledSegment[] {
		if (source.length === 0) return []
		tags.sort((a, b) => a.start - b.start || b.end - a.end)

		const segments: StyledSegment[] = []
		let cursor = 0
		let tagIdx = 0
		const active: Tag[] = []

		// Pull in every tag whose range starts at or before cursor — also
		// covers nested tags whose start is inside an outer tag.
		while (tagIdx < tags.length && tags[tagIdx].start <= cursor) {
			if (tags[tagIdx].end > cursor) active.push(tags[tagIdx])
			tagIdx++
		}

		while (cursor < source.length) {
			// Next boundary: next tag's start, or the soonest active end.
			let nextEnd = tagIdx < tags.length ? tags[tagIdx].start : source.length
			for (const t of active) if (t.end < nextEnd) nextEnd = t.end
			if (nextEnd > source.length) nextEnd = source.length

			this.push(segments, source.slice(cursor, nextEnd), this.pickWinner(active)?.color)
			cursor = nextEnd
			if (cursor >= source.length) break

			for (let i = active.length - 1; i >= 0; i--) {
				if (active[i].end <= cursor) active.splice(i, 1)
			}
			while (tagIdx < tags.length && tags[tagIdx].start <= cursor) {
				if (tags[tagIdx].end > cursor) active.push(tags[tagIdx])
				tagIdx++
			}
		}

		return segments
	}
}