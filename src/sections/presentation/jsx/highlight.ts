/**
 * Tree-sitter based syntax highlighting for `<code>` blocks in the in-game
 * presentation. Runs at build time (in Bun, via Sandstone) — produces extra
 * `StyledSegment`s with per-token colors that flow straight into the
 * `text_display` NBT. See CLAUDE.md "Syntax highlighting" for the end-to-end
 * setup (fetch + parse + render).
 */

import { Parser, Language, Query } from 'web-tree-sitter'
import type { StyledSegment } from './render'

/**
 * Where each registered language's binary assets live. The fetch script
 * (`scripts/fetch-syntax-parsers.ts`) populates these paths — see that file
 * to add a new language.
 */
export type Grammar = { wasmPath: string; queryPath: string }

export type Highlighter = {
	/**
	 * Tokenize `source` for `lang`. Returns an empty array when the
	 * language isn't registered (the renderer's fallback path keeps the
	 * single-color code segment when this happens, so omitting `lang`
	 * doesn't crash — it just degrades).
	 */
	highlight(source: string, lang: string): Promise<StyledSegment[]>
}

// ─────────────────────────────────────────────────────────────────────────
// Scope → color (VS Code Dark Modern, from kevcamel/vscode_dark_modern.zed)
// ─────────────────────────────────────────────────────────────────────────
// Capture names in tree-sitter `.scm` files (`@keyword.control`, `@string`,
// `@function`, …) map 1:1 onto these hex strings. The fallback walk lets a
// `@string.escape` capture inherit from `@string` when the more specific
// scope has no entry — so adding a new variant (e.g. `@string.regex`) is
// just a one-liner if VS Code already covers it, and a sane default if not.

const SCOPE_COLOR = {
	comment: '#6A9955',
	'comment.doc': '#6A9955',
	'string.escape': '#D7BA7D',
	'string.regex': '#D16969',
	'string.special': '#D16969',
	'string.special.symbol': '#D16969',
	string: '#CE9178',
	'text.literal': '#CE9178',
	'tag.component.jsx': '#4EC9B0',
	'function.method': '#DCDCAA',
	'function.call': '#DCDCAA',
	'function.builtin': '#DCDCAA',
	function: '#DCDCAA',
	'preproc.builtin': '#569CD6',
	preproc: '#569CD6',
	'type.builtin': '#569CD6',
	type: '#4EC9B0',
	'constant.builtin': '#569CD6',
	'constant.character.escape': '#569CD6',
	boolean: '#569CD6',
	constant: '#4FC1FF',
	number: '#B5CEA8',
	'variable.special': '#569CD6',
	'variable.parameter': '#9CDCFE',
	variable: '#9CDCFE',
	attribute: '#9CDCFE',
	property: '#9CDCFE',
	constructor: '#569CD6',
	'keyword.control.import': '#C586C0',
	'keyword.control': '#C586C0',
	'keyword.declaration': '#569CD6',
	keyword: '#569CD6',
	tag: '#569CD6',
	embedded: '#D4D4D4',
	'punctuation.special': '#CCCCCC',
	'punctuation.bracket': '#CCCCCC',
	'punctuation.delimiter': '#CCCCCC',
	'punctuation.list_marker': '#CCCCCC',
	punctuation: '#CCCCCC',
	'emphasis.strong': '#569CD6',
	operator: '#D4D4D4',
} as const satisfies Record<string, `#${string}`>

function colorFor(name: string): `#${string}` | undefined {
	const exact = SCOPE_COLOR[name as keyof typeof SCOPE_COLOR]
	if (exact) return exact as `#${string}`
	// Strip the last `.suffix` at a time. Lets a missing `@string.escape`
	// entry fall back to `@string`, or a missing `@keyword.control.import`
	// fall back to `@keyword.control`, etc.
	const parts = name.split('.')
	for (let i = parts.length - 1; i > 0; i--) {
		const prefix = parts.slice(0, i).join('.')
		const fallback = SCOPE_COLOR[prefix as keyof typeof SCOPE_COLOR]
		if (fallback) return fallback as `#${string}`
	}
	return undefined
}

// Specificity ranking for overlap resolution. Lower number wins — same-pri
// ties break on smaller range (more nested). Captures not in this table are
// discarded by `priorityOf` (returning null), so an unknown `@foo` capture
// won't poison the output by claiming generic text.
const SCOPE_PRIORITY: Record<string, number> = {
	comment: 1,
	'string.escape': 2,
	'punctuation.special': 3,
	'string.regex': 4,
	'string.special': 5,
	'tag.component.jsx': 6,
	'constant.character.escape': 7,
	string: 8,
	'function.call': 9,
	'function.method': 10,
	'function.builtin': 11,
	function: 12,
	'preproc.builtin': 13,
	preproc: 14,
	'type.builtin': 15,
	type: 16,
	'constant.builtin': 17,
	boolean: 18,
	constant: 19,
	number: 20,
	'variable.special': 21,
	'variable.parameter': 22,
	variable: 23,
	attribute: 24,
	property: 25,
	constructor: 26,
	'keyword.control.import': 27,
	'keyword.control': 28,
	'keyword.declaration': 29,
	keyword: 30,
	tag: 31,
	embedded: 32,
	'emphasis.strong': 33,
	'punctuation.bracket': 34,
	'punctuation.delimiter': 35,
	'punctuation.list_marker': 36,
	punctuation: 37,
	operator: 38,
}

function priorityOf(name: string): number | null {
	if (name in SCOPE_PRIORITY) return SCOPE_PRIORITY[name]
	const parts = name.split('.')
	for (let i = parts.length - 1; i > 0; i--) {
		const prefix = parts.slice(0, i).join('.')
		if (prefix in SCOPE_PRIORITY) return SCOPE_PRIORITY[prefix]
	}
	return null
}

// ─────────────────────────────────────────────────────────────────────────
// Overlap sweep → non-overlapping styled segments
// ─────────────────────────────────────────────────────────────────────────

type Tag = { start: number; end: number; priority: number; name: string; color: `#${string}` }

/**
 * Pick the active tag with the lowest priority number. On a tie, longer
 * ranges (less specific) win — same rule the legacy stack sweep used.
 */
function pickWinner(active: Tag[]): Tag | undefined {
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

/**
 * Merge a styled segment into `out`, combining with the previous segment
 * when colors match. Keeps the segment list short — adjacent same-color
 * runs would otherwise inflate NBT size for nothing.
 */
function pushSegment(
	out: StyledSegment[],
	text: string,
	color: `#${string}` | undefined,
): void {
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

/**
 * Collapse overlapping tags on a single source string into a non-overlapping
 * list of segments whose concatenation equals `source`. Tags are pre-resolved
 * to a priority (lower wins) + color so the sweep doesn't re-walk the scope
 * tables per character.
 *
 * Algorithm: keep an `active` set of tags whose range covers the current
 * cursor, advance to the next boundary (a tag starting, or the soonest
 * active tag ending), emit a segment for [cursor, boundary) colored by the
 * highest-priority active tag, then drop ended tags and pull in new starts
 * at the boundary. Repeat until the cursor walks past `source.length`.
 *
 * Replaces an earlier stack-based sweep that had two bugs: (a) when no tag
 * was active at the cursor, `nextEnd` defaulted to `source.length` — so the
 * whitespace between two captures was emitted as one giant segment instead
 * of being split at every later tag's start; (b) the inner push loop only
 * fired when a tag started *exactly* at the cursor, so any tag whose start
 * landed inside an already-emitted outer tag's range was silently dropped.
 */
function collapseToSegments(source: string, tags: Tag[]): StyledSegment[] {
	if (source.length === 0) return []
	tags.sort((a, b) => a.start - b.start || b.end - a.end)

	const segments: StyledSegment[] = []
	let cursor = 0
	let tagIdx = 0
	let active: Tag[] = []

	// Pull in every tag whose range starts at or before cursor — also covers
	// nested tags whose start is inside an outer tag that the sweep will
	// process first.
	while (tagIdx < tags.length && tags[tagIdx].start <= cursor) {
		if (tags[tagIdx].end > cursor) active.push(tags[tagIdx])
		tagIdx++
	}

	while (cursor < source.length) {
		// Next boundary: the next tag's start, or the soonest active end —
		// whichever comes first. Whichever's closer determines where this
		// segment stops.
		let nextEnd = tagIdx < tags.length ? tags[tagIdx].start : source.length
		for (const t of active) {
			if (t.end < nextEnd) nextEnd = t.end
		}
		if (nextEnd > source.length) nextEnd = source.length

		pushSegment(segments, source.slice(cursor, nextEnd), pickWinner(active)?.color)

		cursor = nextEnd
		if (cursor >= source.length) break

		// Drop ended tags, pull in new starts at the boundary.
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

// ─────────────────────────────────────────────────────────────────────────
// Async loader + highlighter
// ─────────────────────────────────────────────────────────────────────────

type LoadedGrammar = { language: Language; query: Query }

let initPromise: Promise<void> | null = null

async function ensureInit(): Promise<void> {
	if (initPromise) return initPromise
	// `web-tree-sitter` ships its own `tree-sitter.wasm` runtime and locates
	// it automatically — no `locateFile` arg needed. (See
	// `.temp/tree-sitter-mcfunction/scripts/compare-grammars.js`: same call
	// with no args.)
	initPromise = Parser.init()
	return initPromise
}

async function loadGrammar(grammar: Grammar): Promise<LoadedGrammar> {
	await ensureInit()
	const [wasmBytes, queryText] = await Promise.all([
		Bun.file(grammar.wasmPath).arrayBuffer(),
		Bun.file(grammar.queryPath).text(),
	])
	const language = await Language.load(new Uint8Array(wasmBytes))
	const query = new Query(language, queryText)
	return { language, query }
}

/**
 * Build a highlighter for the given language registry. Initializes
 * `web-tree-sitter` once and loads every registered grammar's wasm + query
 * in parallel.
 *
 * If a grammar's wasm or query is missing, that language silently returns
 * `[]` from `highlight()` — no crash, no log noise. This keeps the renderer
 * working when the dev hasn't run `bun run fetch:parsers` yet (single-color
 * fallback in `wrapCodeWithBorders`).
 */
export async function loadHighlighter(registry: Record<string, Grammar>): Promise<Highlighter> {
	const loaded: Record<string, LoadedGrammar | null> = {}
	await Promise.all(
		Object.entries(registry).map(async ([lang, def]) => {
			try {
				loaded[lang] = await loadGrammar(def)
			} catch (err) {
				console.warn(`[highlight] failed to load "${lang}" grammar: ${err}`)
				loaded[lang] = null
			}
		}),
	)

	return {
		async highlight(source, lang) {
			const grammar = loaded[lang]
			if (!grammar) return []
			const parser = new Parser()
			parser.setLanguage(grammar.language)
			const tree = parser.parse(source)
			if (!tree) {
				parser.delete()
				return []
			}
			try {
				const captures = grammar.query.captures(tree.rootNode)
				const tags: Tag[] = []
				for (const cap of captures) {
					const priority = priorityOf(cap.name)
					if (priority === null) continue
					const color = colorFor(cap.name)
					if (!color) continue
					const start = cap.node.startIndex
					const end = cap.node.endIndex
					if (start === end) continue
					tags.push({ start, end, priority, name: cap.name, color })
				}
				return collapseToSegments(source, tags)
			} finally {
				tree.delete()
				parser.delete()
			}
		},
	}
}

/**
 * Pre-compute the highlighted segments for every `(source, lang)` pair the
 * renderer needs. Returns a sync `lookup(source, lang) → StyledSegment[]`
 * the synchronous layout pass uses. Same-source + same-lang pairs are
 * deduped so a long block of identical code only parses once.
 *
 * The async work is bounded by the count of distinct `(source, lang)`
 * tuples across the whole scene, not the number of `<code>` elements.
 * Matches the pattern `collectFonts` already uses for font metric
 * pre-loading in `renderSlides`.
 */
export async function precomputeHighlights(
	registry: Record<string, Grammar>,
	requests: Array<{ source: string; lang: string }>,
): Promise<(source: string, lang: string) => StyledSegment[] | null> {
	const highlighter = await loadHighlighter(registry)

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
