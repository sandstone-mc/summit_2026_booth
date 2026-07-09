/**
 * Populate `resources/jsx/parser/` with the tree-sitter grammars + highlight
 * queries the presentation's `<code>` highlighter needs.
 *
 * Idempotent — exits early if all four files are already present. Source of
 * truth for what's needed lives in GRAMMARS below; add a new entry there
 * (with wasm + query source URLs) and re-run this script to add a language.
 *
 * Outputs (all under `resources/jsx/parser/`):
 *   tree-sitter-mcfunction.wasm   (built from .temp/tree-sitter-mcfunction/)
 *   mcfunction.highlights.scm     (copied from the grammar repo)
 *   tree-sitter-typescript.wasm   (downloaded from the upstream release)
 *   typescript.highlights.scm     (downloaded from the upstream repo)
 *
 * The output dir is gitignored — see `.gitignore` next to this file.
 */

import { $ } from 'bun'
import { existsSync } from 'fs'
import { mkdir, copyFile, writeFile, stat } from 'fs/promises'
import path from 'path'

const ROOT = path.resolve(import.meta.dir, '..')
const TARGET_DIR = path.join(ROOT, 'resources', 'jsx', 'parser')

const MCF_GRAMMAR_DIR = path.join(ROOT, '.temp', 'tree-sitter-mcfunction')
const TS_WASM_PATH = path.join(ROOT, '.temp', 'tree-sitter-typescript.wasm')

// Where to fetch each artifact if not already on disk. Kept here so adding a
// new grammar is a one-line change to the GRAMMARS map.
const ARTIFACTS = {
	mcfunction: {
		wasm: path.join(MCF_GRAMMAR_DIR, 'build', 'tree-sitter-mcfunction.wasm'),
		query: path.join(MCF_GRAMMAR_DIR, 'src', 'queries', 'highlights.scm'),
		queryUrl: null,
	},
	typescript: {
		wasm: TS_WASM_PATH,
		query: null,
		// TS-specific patterns. The wasm we ship also parses JS (TS+JS share
		// a grammar), but the root `queries/highlights.scm` in
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
}

async function fileSize(p: string): Promise<string> {
	try {
		const s = await stat(p)
		const kb = s.size / 1024
		return `${kb.toFixed(1)} KB`
	} catch {
		return 'missing'
	}
}

async function download(url: string, dest: string): Promise<void> {
	console.log(`  fetching ${url}`)
	// GitHub raw URLs hit aggressive unauthenticated rate limits; `gh api`
	// reuses the user's auth token and bypasses them. Falls back to plain
	// fetch for non-GitHub URLs (which there aren't any of right now, but
	// the path is here for future grammars hosted elsewhere).
	if (url.startsWith('https://raw.githubusercontent.com/')) {
		// raw.githubusercontent.com/<owner>/<repo>/<ref>/<path>
		//   → repos/<owner>/<repo>/contents/<path>?ref=<ref>
		const tail = url.slice('https://raw.githubusercontent.com/'.length)
		const [owner, repo, ref, ...rest] = tail.split('/')
		const apiPath = `repos/${owner}/${repo}/contents/${rest.join('/')}?ref=${ref}`
		const body = (await $`gh api ${apiPath} --jq .content`.text()).trim()
		const decoded = Buffer.from(body, 'base64')
		await writeFile(dest, decoded)
		return
	}
	const res = await fetch(url)
	if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
	await writeFile(dest, res.body as any)
}

async function buildMcfunctionWasm(): Promise<void> {
	if (!existsSync(MCF_GRAMMAR_DIR)) {
		throw new Error(
			`mcfunction grammar source missing at ${path.relative(ROOT, MCF_GRAMMAR_DIR)}\n` +
				`Clone the grammar repo there first (see its CLAUDE.md for build instructions),\n` +
				`then re-run this script.`,
		)
	}
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

async function ensureTypescriptAssets(): Promise<void> {
	const { wasm, query } = OUTPUTS.typescript
	// Pre-staged wasm wins (faster, offline-capable). Fall back to upstream
	// download if the user hasn't dropped the release artifact into .temp/.
	const srcWasm = existsSync(ARTIFACTS.typescript.wasm)
		? ARTIFACTS.typescript.wasm
		: null
	if (!srcWasm) {
		throw new Error(
			`typescript wasm missing at ${path.relative(ROOT, ARTIFACTS.typescript.wasm)}.\n` +
				`Either drop the upstream release's tree-sitter-typescript.wasm there,\n` +
				`or set ARTIFACTS.typescript.wasmUrl to a fetch URL and re-run.`,
		)
	}
	if (!existsSync(wasm)) await copyFile(srcWasm, wasm)
	if (!existsSync(query)) {
		const urls = (ARTIFACTS.typescript as any).queryUrls as string[] | undefined
		const url = (ARTIFACTS.typescript as any).queryUrl as string | undefined
		const sources = urls ?? (url ? [url] : [])
		if (sources.length === 0) throw new Error(`no queryUrl configured for typescript`)
		const parts: string[] = []
		for (const u of sources) parts.push(await fetchText(u))
		await writeFile(query, parts.join('\n\n'))
	}
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

	console.log('\nFinal layout:')
	for (const lang of Object.keys(OUTPUTS) as LangName[]) {
		const { wasm, query } = OUTPUTS[lang]
		console.log(`  ${lang.padEnd(11)} wasm=${await fileSize(wasm).then((s) => s.padStart(10))}  query=${await fileSize(query)}`)
	}
	console.log('\nDone. Run `bun run dev:build` to regenerate the datapack.')
}

await main()