/**
 * Populate `resources/jsx/parser/` with the tree-sitter grammars + highlight
 * queries the presentation's `<code>` highlighter needs.
 *
 * Idempotent — exits early if all output files are already present.
 * On a fresh clone (empty `resources/jsx/parser/` aside from `.gitkeep`),
 * this script:
 *   1. Clones the mcfunction grammar into `resources/jsx/parser/tree-sitter-mcfunction/`
 *      (default: the MulverineX fork — override via `mcfunction.repoUrl`)
 *   2. Runs `bun install` + `bun run build` to emit the wasm into the
 *      grammar's `build/` directory
 *   3. Downloads the upstream TypeScript + JSON wasm straight into the
 *      parser dir (override via `typescript.wasmUrl` / `json.wasmUrl`)
 *   4. Pulls each language's `queries/highlights.scm` via the GitHub API
 *
 * Source of truth for what's fetched lives in ARTIFACTS below; the matching
 * consumer-side registry (`GRAMMARS` in `render.ts`) lists where the
 * rendered code blocks look for them. Add a language by appending to both.
 *
 * Final outputs (all under `resources/jsx/parser/`):
 *   tree-sitter-mcfunction.wasm   (built from the cloned grammar repo)
 *   mcfunction.highlights.scm     (copied from the grammar repo)
 *   tree-sitter-typescript.wasm   (downloaded from the upstream release)
 *   typescript.highlights.scm     (concatenated from upstream queries)
 *   tree-sitter-json.wasm         (downloaded from the upstream release)
 *   json.highlights.scm           (downloaded from upstream queries)
 *   vscode-dark-modern.json       (reference copy of the upstream theme)
 *
 * The theme is only consumed as a reference — the `SCOPE_COLOR` map in
 * `highlight.ts` is hand-maintained from it, so contributors can look up
 * the canonical hex for any scope without hitting GitHub. It is NOT
 * loaded at build time.
 *
 * The parser dir is gitignored (except `.gitkeep`) — see `.gitignore` next
 * to this file. A fresh clone won't have any of these files until you run
 * this script; the build pipeline degrades gracefully to single-color `<code>`
 * rendering when a grammar is missing.
 */

import { $ } from 'bun'
import { existsSync } from 'fs'
import { mkdir, copyFile, writeFile, stat } from 'fs/promises'
import path from 'path'

const ROOT = path.resolve(import.meta.dir, '..')
const TARGET_DIR = path.join(ROOT, 'resources', 'jsx', 'parser')

const MCF_GRAMMAR_DIR = path.join(TARGET_DIR, 'tree-sitter-mcfunction')

// Where to fetch each artifact if not already on disk. Add a new language
// by appending an entry here + adding a row to GRAMMARS in render.ts.
const ARTIFACTS = {
	mcfunction: {
		// Built locally from the cloned grammar repo.
		wasm: path.join(MCF_GRAMMAR_DIR, 'build', 'tree-sitter-mcfunction.wasm'),
		query: path.join(MCF_GRAMMAR_DIR, 'src', 'queries', 'highlights.scm'),
		repoUrl: 'https://github.com/MulverineX/tree-sitter-mcfunction.git',
	},
	typescript: {
		// Downloaded straight into the parser dir (no staging). The wasm on
		// GitHub ships as a TypeScript+JS combo.
		wasm: path.join(TARGET_DIR, 'tree-sitter-typescript.wasm'),
		wasmUrl: 'https://github.com/tree-sitter/tree-sitter-typescript/releases/latest/download/tree-sitter-typescript.wasm',
		query: null,
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
		query: null,
		queryUrls: [
			'https://raw.githubusercontent.com/tree-sitter/tree-sitter-json/master/queries/highlights.scm',
		],
	},
} as const

type LangName = keyof typeof ARTIFACTS

const OUTPUTS: Record<LangName, { wasm: string; query: string }> = {
	mcfunction: {
		wasm: path.join(TARGET_DIR, 'tree-sitter-mcfunction.wasm'),
		query: path.join(TARGET_DIR, 'mcfunction.highlights.scm'),
	},
	typescript: {
		wasm: path.join(TARGET_DIR, 'tree-sitter-typescript.wasm'),
		query: path.join(TARGET_DIR, 'typescript.highlights.scm'),
	},
	json: {
		wasm: path.join(TARGET_DIR, 'tree-sitter-json.wasm'),
		query: path.join(TARGET_DIR, 'json.highlights.scm'),
	},
}

// Upstream VS Code Dark Modern theme — the canonical source the
// `SCOPE_COLOR` map in `highlight.ts` is hand-maintained from. Kept as a
// reference copy next to the parser assets so a contributor can grep the
// local file when picking colors for a new capture, instead of having to
// hit GitHub.
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

async function ensureMcfunctionGrammarRepo(): Promise<void> {
	if (existsSync(MCF_GRAMMAR_DIR)) {
		console.log(`  mcfunction grammar already at ${path.relative(ROOT, MCF_GRAMMAR_DIR)}`)
		return
	}
	console.log(`  cloning ${ARTIFACTS.mcfunction.repoUrl} → ${path.relative(ROOT, MCF_GRAMMAR_DIR)}`)
	await mkdir(MCF_GRAMMAR_DIR, { recursive: true })
	await $`git clone --depth 1 ${ARTIFACTS.mcfunction.repoUrl} ${MCF_GRAMMAR_DIR}`.quiet()
}

async function buildMcfunctionWasm(): Promise<void> {
	await ensureMcfunctionGrammarRepo()
	const builtWasm = ARTIFACTS.mcfunction.wasm
	if (existsSync(builtWasm)) {
		console.log(`  mcfunction wasm already built at ${path.relative(ROOT, builtWasm)}`)
		return
	}
	console.log(`  installing deps + building mcfunction wasm in ${path.relative(ROOT, MCF_GRAMMAR_DIR)}`)
	await $`cd ${MCF_GRAMMAR_DIR} && bun install --silent`.quiet()
	await $`cd ${MCF_GRAMMAR_DIR} && bun run build`.quiet()
	if (!existsSync(builtWasm)) {
		throw new Error(`build succeeded but ${path.relative(ROOT, builtWasm)} was not produced`)
	}
}

async function ensureMcfunctionAssets(): Promise<void> {
	const { wasm, query } = OUTPUTS.mcfunction
	const alreadyHave = existsSync(wasm) && existsSync(query)
	if (!alreadyHave) await buildMcfunctionWasm()
	if (!existsSync(wasm)) await copyFile(ARTIFACTS.mcfunction.wasm, wasm)
	if (!existsSync(query)) await copyFile(ARTIFACTS.mcfunction.query, query)
}

async function downloadToFile(url: string, dest: string): Promise<void> {
	console.log(`  downloading ${url}`)
	const res = await fetch(url, { redirect: 'follow' })
	if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`)
	const buf = Buffer.from(await res.arrayBuffer())
	await writeFile(dest, buf)
}

async function ensureTypescriptAssets(): Promise<void> {
	const { wasm, query } = OUTPUTS.typescript
	// TS wasm path is its final output path (no staging). Download directly
	// to `dest` if missing.
	if (!existsSync(wasm)) await downloadToFile(ARTIFACTS.typescript.wasmUrl, wasm)
	if (!existsSync(query)) {
		const parts: string[] = []
		for (const u of ARTIFACTS.typescript.queryUrls) parts.push(await fetchText(u))
		await writeFile(query, parts.join('\n\n'))
	}
}

// Same shape as `ensureTypescriptAssets` but the JSON grammar ships a
// single prebuilt wasm + single upstream `queries/highlights.scm` (no
// parent-grammar concatenation needed). Kept as its own function so the
// JSON-specific URL set lives in one place and the typescript helper
// doesn't grow an unrelated branch.
async function ensureJsonAssets(): Promise<void> {
	const { wasm, query } = OUTPUTS.json
	if (!existsSync(wasm)) await downloadToFile(ARTIFACTS.json.wasmUrl, wasm)
	if (!existsSync(query)) {
		const parts: string[] = []
		for (const u of ARTIFACTS.json.queryUrls) parts.push(await fetchText(u))
		await writeFile(query, parts.join('\n\n'))
	}
}

async function ensureTheme(): Promise<void> {
	if (existsSync(THEME_OUTPUT)) {
		console.log(`  theme already at ${path.relative(ROOT, THEME_OUTPUT)}`)
		return
	}
	const text = await fetchText(THEME_URL)
	await writeFile(THEME_OUTPUT, text)
}

async function fetchText(url: string): Promise<string> {
	console.log(`  fetching ${url}`)
	if (url.startsWith('https://raw.githubusercontent.com/')) {
		const tail = url.slice('https://raw.githubusercontent.com/'.length)
		const [owner, repo, ref, ...rest] = tail.split('/')
		const apiPath = `repos/${owner}/${repo}/contents/${rest.join('/')}?ref=${ref}`
		const body = (await $`gh api ${apiPath} --jq .content`.text()).trim()
		return Buffer.from(body, 'base64').toString('utf8')
	}
	const res = await fetch(url)
	if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
	return await res.text()
}

async function main(): Promise<void> {
	await mkdir(TARGET_DIR, { recursive: true })
	console.log(`Target: ${path.relative(ROOT, TARGET_DIR)}`)

	await ensureMcfunctionAssets()
	await ensureTypescriptAssets()
	await ensureJsonAssets()
	await ensureTheme()

	console.log('\nFinal layout:')
	for (const lang of Object.keys(OUTPUTS) as LangName[]) {
		const { wasm, query } = OUTPUTS[lang]
		console.log(`  ${lang.padEnd(11)} wasm=${await fileSize(wasm).then((s) => s.padStart(10))}  query=${await fileSize(query)}`)
	}
	console.log(`  ${'theme'.padEnd(11)} ${path.relative(ROOT, THEME_OUTPUT)}=${(await fileSize(THEME_OUTPUT)).padStart(10)}`)
	console.log('\nDone. Run `bun run dev:build` to regenerate the datapack.')
}

await main()