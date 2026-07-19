// Grammar auto-fetch — auto-populates the tree-sitter wasm + .scm
// files + VS Code Dark Modern theme on first build. Called by
// `CodeComponent.prepare()` so grammar fetching is owned by the code
// component. Memoized at module scope.

import { $ } from 'bun'
import { existsSync } from 'fs'
import { mkdir, copyFile, writeFile, stat } from 'fs/promises'
import path from 'path'
import type { Grammar } from './highlight/highlighter'

const ROOT = process.cwd()
const TARGET_DIR = path.join(ROOT, 'resources', 'cache', 'jsx', 'parser')
const MCF_GRAMMAR_DIR = path.join(TARGET_DIR, 'tree-sitter-mcfunction')

const ARTIFACTS = {
	mcfunction: {
		wasm: path.join(MCF_GRAMMAR_DIR, 'build', 'tree-sitter-mcfunction.wasm'),
		query: path.join(MCF_GRAMMAR_DIR, 'src', 'queries', 'highlights.scm'),
		repoUrl: 'https://github.com/MulverineX/tree-sitter-mcfunction.git',
	},
	typescript: {
		wasm: path.join(TARGET_DIR, 'tree-sitter-typescript.wasm'),
		wasmUrl: 'https://github.com/tree-sitter/tree-sitter-typescript/releases/latest/download/tree-sitter-typescript.wasm',
		query: null,
		queryUrls: [
			'https://raw.githubusercontent.com/tree-sitter/tree-sitter-javascript/master/queries/highlights.scm',
			'https://raw.githubusercontent.com/tree-sitter/tree-sitter-typescript/master/queries/highlights.scm',
		],
	},
	json: {
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

const THEME_URL =
	'https://raw.githubusercontent.com/kevcamel/vscode_dark_modern.zed/main/themes/vscode-dark-modern.json'
const THEME_OUTPUT = path.join(TARGET_DIR, 'vscode-dark-modern.json')

// Public registry consumed by `prepare()` below.
export const GRAMMARS: Record<string, Grammar> = {
	mcfunction: {
		wasmPath: 'resources/cache/jsx/parser/tree-sitter-mcfunction.wasm',
		queryPath: 'resources/cache/jsx/parser/mcfunction.highlights.scm',
	},
	typescript: {
		wasmPath: 'resources/cache/jsx/parser/tree-sitter-typescript.wasm',
		queryPath: 'resources/cache/jsx/parser/typescript.highlights.scm',
	},
	json: {
		wasmPath: 'resources/cache/jsx/parser/tree-sitter-json.wasm',
		queryPath: 'resources/cache/jsx/parser/json.highlights.scm',
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
	if (!existsSync(wasm)) await downloadToFile(ARTIFACTS.typescript.wasmUrl, wasm)
	if (!existsSync(query)) {
		const parts: string[] = []
		for (const u of ARTIFACTS.typescript.queryUrls) parts.push(await fetchText(u))
		await writeFile(query, parts.join('\n\n'))
	}
}

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
		const body = (await $`gh api ${apiPath} --jq .content`.text()).trim()
		return Buffer.from(body, 'base64').toString('utf8')
	}
	const res = await fetch(url)
	if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
	return await res.text()
}

// Memoized so concurrent calls share one fetch. Errors are caught +
// logged — fetch failures degrade the build to single-color `<code>`
// rendering rather than aborting it.
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
		for (const lang of Object.keys(OUTPUTS) as LangName[]) {
			const { wasm, query } = OUTPUTS[lang]
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
		// Reset memo so the next prepare() retries the fetch instead
		// of caching the failure forever.
		ensurePromise = null
	}
}