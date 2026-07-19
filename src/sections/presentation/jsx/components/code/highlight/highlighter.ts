// Highlighter — owns a registry of grammars, runs tree-sitter parses
// against user source, tokenizes via `Tokenizer`.

import { Parser, Language, Query } from 'web-tree-sitter'
import type { StyledSegment } from '../../../render'
import { Theme } from './theme'
import { Tokenizer } from './tokenize'

export type Grammar = { wasmPath: string; queryPath: string }

type LoadedGrammar = { language: Language; query: Query }

export class Highlighter {
	private tokenizer = new Tokenizer()
	private initPromise: Promise<void> | null = null
	private grammars = new Map<string, LoadedGrammar | null>()
	private theme = new Theme()

	private async ensureInit(): Promise<void> {
		if (this.initPromise) return this.initPromise
		this.initPromise = Parser.init()
		return this.initPromise
	}

	private async loadGrammar(grammar: Grammar): Promise<LoadedGrammar> {
		await this.ensureInit()
		const [wasmBytes, queryText] = await Promise.all([
			Bun.file(grammar.wasmPath).arrayBuffer(),
			Bun.file(grammar.queryPath).text(),
		])
		const language = await Language.load(new Uint8Array(wasmBytes))
		const query = new Query(language, queryText)
		return { language, query }
	}

	// Load + cache every grammar in `registry`. Returns a function that
	// tokenizes arbitrary source for a given language.
	static async create(
		registry: Record<string, Grammar>,
		theme: Theme = new Theme(),
	): Promise<Highlighter> {
		const h = new Highlighter()
		h.theme = theme
		await theme.load()
		await Promise.all(
			Object.entries(registry).map(async ([lang, def]) => {
				try {
					h.grammars.set(lang, await h.loadGrammar(def))
				} catch (err) {
					console.warn(`[highlight] failed to load "${lang}" grammar: ${err}`)
					h.grammars.set(lang, null)
				}
			}),
		)
		return h
	}

	// Tokenize `source` for `lang`. Returns [] when no grammar is loaded.
	async highlight(source: string, lang: string): Promise<StyledSegment[]> {
		const grammar = this.grammars.get(lang)
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
			const tokenizer = this.tokenizer
			const tags: Array<{ start: number; end: number; priority: number; name: string; color: `#${string}` }> = []
			for (const cap of captures) {
				const priority = tokenizer.priorityOf(cap.name)
				const color = this.theme.colorFor(cap.name)
				if (!color) continue
				const start = cap.node.startIndex
				const end = cap.node.endIndex
				if (start === end) continue
				tags.push({ start, end, priority, name: cap.name, color })
			}
			return tokenizer.collapseToSegments(source, tags)
		} finally {
			tree.delete()
			parser.delete()
		}
	}
}