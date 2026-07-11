// Loads VS Code Dark Modern's `tokenColors` and looks up a color for any
// tree-sitter capture name. Strips `.suffix` one at a time so a missing
// `@string.escape` entry falls back to `@string`, etc.

const THEME_PATH = 'resources/jsx/parser/vscode-dark-modern.json'

type ThemeSyntax = Record<string, { color?: string | null } | undefined>
type ThemeJson = { themes?: Array<{ style?: { syntax?: ThemeSyntax } }> }

export class Theme {
	private colors: Record<string, `#${string}`> = {}
	private loaded = false

	async load(): Promise<void> {
		if (this.loaded) return
		try {
			const text = await Bun.file(THEME_PATH).text()
			const json = JSON.parse(text) as ThemeJson
			const syntax = json.themes?.[0]?.style?.syntax ?? {}
			for (const [scope, entry] of Object.entries(syntax)) {
				const color = entry?.color
				if (typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color)) {
					this.colors[scope] = color as `#${string}`
				}
			}
		} catch (err) {
			console.warn(`[highlight] theme unavailable at ${THEME_PATH}: ${err}`)
		}
		this.loaded = true
	}

	// Exact lookup, then strip the last `.suffix` at a time.
	colorFor(name: string): `#${string}` | undefined {
		const exact = this.colors[name]
		if (exact) return exact
		const parts = name.split('.')
		for (let i = parts.length - 1; i > 0; i--) {
			const fallback = this.colors[parts.slice(0, i).join('.')]
			if (fallback) return fallback
		}
		return undefined
	}
}