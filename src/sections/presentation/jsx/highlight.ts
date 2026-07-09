import { Parser, Language, Query } from 'web-tree-sitter'
import type { StyledSegment } from './render'

export type Grammar = { wasmPath: string; queryPath: string }

export type Highlighter = {
	highlight(source: string, lang: string): Promise<StyledSegment[]>
}

const THEME_PATH = 'resources/jsx/parser/vscode-dark-modern.json'

type ThemeSyntax = Record<string, { color?: string | null } | undefined>
type ThemeJson = { themes?: Array<{ style?: { syntax?: ThemeSyntax } }> }

let cachedThemeColors: Record<string, `#${string}`> | null = null

async function loadThemeColors(): Promise<Record<string, `#${string}`>> {
	if (cachedThemeColors) return cachedThemeColors
	try {
		const text = await Bun.file(THEME_PATH).text()
		const json = JSON.parse(text) as ThemeJson
		const syntax = json.themes?.[0]?.style?.syntax ?? {}
		const out: Record<string, `#${string}`> = {}
		for (const [scope, entry] of Object.entries(syntax)) {
			const color = entry?.color
			if (typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color)) {
				out[scope] = color as `#${string}`
			}
		}
		cachedThemeColors = out
		return out
	} catch (err) {
		console.warn(`[highlight] theme unavailable at ${THEME_PATH}: ${err}`)
		cachedThemeColors = {}
		return cachedThemeColors
	}
}

function colorFor(name: string, colors: Record<string, `#${string}`>): `#${string}` | undefined {
	const exact = colors[name]
	if (exact) return exact
	// Strip the last `.suffix` at a time. Lets a missing `@string.escape`
	// entry fall back to `@string`, or a missing `@keyword.control.import`
	// fall back to `@keyword.control`, etc.
	const parts = name.split('.')
	for (let i = parts.length - 1; i > 0; i--) {
		const prefix = parts.slice(0, i).join('.')
		const fallback = colors[prefix]
		if (fallback) return fallback
	}
	return undefined
}

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

function priorityOf(name: string): number {
	if (PROMOTED.has(name)) return PROMOTED_PRIORITY
	const parts = name.split('.')
	const catIdx = CATEGORY_ORDER.indexOf(parts[0] as (typeof CATEGORY_ORDER)[number])
	const cat = catIdx === -1 ? CATEGORY_ORDER.length : catIdx
	return cat * 100 - parts.length
}
type Tag = { start: number; end: number; priority: number; name: string; color: `#${string}` }

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

function collapseToSegments(source: string, tags: Tag[]): StyledSegment[] {
	if (source.length === 0) return []
	tags.sort((a, b) => a.start - b.start || b.end - a.end)

	const segments: StyledSegment[] = []
	let cursor = 0
	let tagIdx = 0
	let active: Tag[] = []

	// Pull in every tag whose range starts at or before cursor - also covers
	// nested tags whose start is inside an outer tag that the sweep will
	// process first.
	while (tagIdx < tags.length && tags[tagIdx].start <= cursor) {
		if (tags[tagIdx].end > cursor) active.push(tags[tagIdx])
		tagIdx++
	}

	while (cursor < source.length) {
		// Next boundary: the next tag's start, or the soonest active end -
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

type LoadedGrammar = { language: Language; query: Query }

let initPromise: Promise<void> | null = null

async function ensureInit(): Promise<void> {
	if (initPromise) return initPromise
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

export async function loadHighlighter(registry: Record<string, Grammar>): Promise<Highlighter> {
	const colors = await loadThemeColors()
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
					const color = colorFor(cap.name, colors)
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
