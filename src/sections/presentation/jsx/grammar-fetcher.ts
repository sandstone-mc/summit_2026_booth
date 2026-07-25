// Auto-fetch tree-sitter grammars + highlight queries the JSX
// framework's `<code>` highlighter needs. Called once from the top of
// `render()` / `renderSlides()` so a fresh clone gets the wasm +
// .scm files on first build — no separate setup script.
//
// On a missing parser dir this will:
//   1. Download each language's prebuilt wasm straight into the parser
//      dir from its GitHub releases (override via `*.wasmUrl`)
//   2. Fetch each language's `queries/highlights.scm` from raw github
//      (override via `*.queryUrl` / `*.queryUrls`)
//   3. Copy the VS Code Dark Modern theme JSON for `Theme` to load
//
// Source of truth for what's fetched lives in ARTIFACTS below; the
// matching consumer-side registry (`GRAMMARS` in `layout/constants.ts`)
// lists where the rendered code blocks look for them. Add a language by
// appending to both.
//
// Errors are caught + warned (NOT thrown) so a flaky network on the
// first build doesn't break the build — the renderer falls back to
// single-color `<code>` rendering when a grammar fails to load. The
// matching graceful-degrade path lives in `Highlighter.create()`.

import { $ } from 'bun'
import { existsSync } from 'fs'
import { mkdir, writeFile, stat } from 'fs/promises'
import path from 'path'

const ROOT = process.cwd()
const TARGET_DIR = path.join(ROOT, 'resources', 'cache', 'jsx', 'parser')

// Where to fetch each artifact if not already on disk. Add a new language
// by appending an entry here + adding a row to GRAMMARS in layout/constants.ts.
const ARTIFACTS = {
	mcfunction: {
		wasm: path.join(TARGET_DIR, 'tree-sitter-mcfunction.wasm'),
		wasmUrl:
			'https://github.com/MulverineX/tree-sitter-mcfunction/releases/latest/download/tree-sitter-mcfunction.wasm',
		query: path.join(TARGET_DIR, 'mcfunction.highlights.scm'),
		queryUrl:
			'https://raw.githubusercontent.com/MulverineX/tree-sitter-mcfunction/main/src/queries/highlights.scm',
	},
	typescript: {
		// Downloaded straight into the parser dir (no staging). The wasm on
		// GitHub ships as a TypeScript+JS combo.
		wasm: path.join(TARGET_DIR, 'tree-sitter-typescript.wasm'),
		wasmUrl:
			'https://github.com/tree-sitter/tree-sitter-typescript/releases/latest/download/tree-sitter-typescript.wasm',
		query: path.join(TARGET_DIR, 'typescript.highlights.scm'),
		// TS-specific patterns. The root `queries/highlights.scm` in
		// `tree-sitter-typescript` is just the TS-specific overrides — the
		// JS base (for `const`, `import`, strings, comments, …) lives in
		// `tree-sitter-javascript`. Concatenate them at fetch time; the TS
		// file is appended LAST so its patterns override the JS ones when
		// both match (the query system picks the first match, so order
		// matters: more-specific → less-specific).
		queryUrls: [
			'https://raw.githubusercontent.com/tree-sitter/tree-sitter-javascript/master/queries/highlights.scm',
			'https://raw.githubusercontent.com/tree-sitter/tree-sitter-typescript/master/queries/highlights.scm',
		],
	},
	json: {
		// Downloaded straight into the parser dir (no staging). Upstream
		// `tree-sitter-json` ships a single prebuilt wasm per release.
		wasm: path.join(TARGET_DIR, 'tree-sitter-json.wasm'),
		wasmUrl: 'https://github.com/tree-sitter/tree-sitter-json/releases/latest/download/tree-sitter-json.wasm',
		query: path.join(TARGET_DIR, 'json.highlights.scm'),
		queryUrl: 'https://raw.githubusercontent.com/tree-sitter/tree-sitter-json/master/queries/highlights.scm',
	},
} as const

type LangName = keyof typeof ARTIFACTS

// Upstream VS Code Dark Modern theme — the canonical source the
// `SCOPE_COLOR` map in `highlight/theme.ts` is hand-maintained from.
// Auto-fetched so `Theme.load()` can read it on first build.
const THEME_URL =
	'https://raw.githubusercontent.com/kevcamel/vscode_dark_modern.zed/main/themes/vscode-dark-modern.json'
const THEME_OUTPUT = path.join(TARGET_DIR, 'vscode-dark-modern.json')

async function fileSize(p: string): Promise<string> {
	try {
		const s = await stat(p)
		const kb = s.size / 1024
		return `${kb.toFixed(1)} KB`
	} catch {
		return 'missing'
	}
}

async function downloadToFile(url: string, dest: string): Promise<void> {
	console.log(`  downloading ${url}`)
	const res = await fetch(url, { redirect: 'follow' })
	if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`)
	const buf = Buffer.from(await res.arrayBuffer())
	await writeFile(dest, buf)
}

async function ensureMcfunctionAssets(): Promise<void> {
	const { wasm, wasmUrl, query, queryUrl } = ARTIFACTS.mcfunction
	if (!existsSync(wasm)) await downloadToFile(wasmUrl, wasm)
	if (!existsSync(query)) await writeFile(query, await fetchText(queryUrl))
}

async function ensureTypescriptAssets(): Promise<void> {
	const { wasm, wasmUrl, query, queryUrls } = ARTIFACTS.typescript
	// TS wasm path is its final output path (no staging). Download directly
	// to `dest` if missing.
	if (!existsSync(wasm)) await downloadToFile(wasmUrl, wasm)
	if (!existsSync(query)) {
		const parts: string[] = []
		for (const u of queryUrls) parts.push(await fetchText(u))
		await writeFile(query, parts.join('\n\n'))
	}
}

// Same shape as `ensureTypescriptAssets` but the JSON grammar ships a
// single prebuilt wasm + single upstream `queries/highlights.scm` (no
// parent-grammar concatenation needed). Kept as its own function so the
// JSON-specific URL set lives in one place and the typescript helper
// doesn't grow an unrelated branch.
async function ensureJsonAssets(): Promise<void> {
	const { wasm, wasmUrl, query, queryUrl } = ARTIFACTS.json
	if (!existsSync(wasm)) await downloadToFile(wasmUrl, wasm)
	if (!existsSync(query)) await writeFile(query, await fetchText(queryUrl))
}

async function ensureTheme(): Promise<void> {
	if (existsSync(THEME_OUTPUT)) return
	const text = await fetchText(THEME_URL)
	await writeFile(THEME_OUTPUT, text)
}

async function fetchText(url: string): Promise<string> {
	console.log(`  fetching ${url}`)
	if (url.startsWith('https://raw.githubusercontent.com/')) {
		const tail = url.slice('https://raw.githubusercontent.com/'.length)
		const [owner, repo, ref, ...rest] = tail.split('/')
		const apiPath = `repos/${owner}/${repo}/contents/${rest.join('/')}?ref=${ref}`
		try {
			const body = (await $`gh api ${apiPath} --jq .content`.text()).trim()
			return Buffer.from(body, 'base64').toString('utf8')
		} catch (err) {
			// `gh` missing or unauthenticated. The raw URL returns the file
			// directly (no base64) so it works without any tooling.
			console.warn(`  [sandstone-jsx] gh fetch failed (${err instanceof Error ? err.message : err}); falling back to raw URL`)
			const res = await fetch(url)
			if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
			return await res.text()
		}
	}
	const res = await fetch(url)
	if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
	return await res.text()
}

// Memoized so concurrent `render()` + `renderSlides()` calls (or a
// render followed by a rerender during the same build) share one fetch.
// All errors are caught + logged — fetch failures degrade the build to
// single-color `<code>` rendering rather than aborting it.
let ensurePromise: Promise<void> | null = null
export function ensureGrammars(): Promise<void> {
	if (ensurePromise) return ensurePromise
	ensurePromise = ensureGrammarsImpl()
	return ensurePromise
}

async function ensureGrammarsImpl(): Promise<void> {
	try {
		await mkdir(TARGET_DIR, { recursive: true })
		console.log(`[sandstone-jsx] ensuring grammars in ${path.relative(ROOT, TARGET_DIR)}`)

		await ensureMcfunctionAssets()
		await ensureTypescriptAssets()
		await ensureJsonAssets()
		await ensureTheme()

		console.log('[sandstone-jsx] parser assets ready:')
		for (const lang of Object.keys(ARTIFACTS) as LangName[]) {
			const { wasm, query } = ARTIFACTS[lang]
			const ws = await fileSize(wasm)
			const qs = await fileSize(query)
			console.log(`  ${lang.padEnd(11)} wasm=${ws.padStart(10)}  query=${qs}`)
		}
		const ts = await fileSize(THEME_OUTPUT)
		console.log(`  ${'theme'.padEnd(11)} ${path.relative(ROOT, THEME_OUTPUT)}=${ts.padStart(10)}`)
	} catch (err) {
		console.warn(
			`[sandstone-jsx] grammar auto-fetch failed — <code> blocks will render single-color this build:\n  ${err}`,
		)
		// Reset memo so the next render() call retries the fetch instead
		// of caching the failure forever.
		ensurePromise = null
	}
}