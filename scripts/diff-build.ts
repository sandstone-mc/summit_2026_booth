#!/usr/bin/env bun
/**
 * Diff current build (`.sandstone/output/`) against a previously-stored
 * build from the `.previous-builds/` git repo.
 *
 * Usage:
 *   bun scripts/diff-build.ts                          # against .previous-builds HEAD (pending changes)
 *   bun scripts/diff-build.ts <commit-ish>             # against a hash/prefix, or HEAD~1, etc.
 *   bun scripts/diff-build.ts <substring>              # substring of any commit's message body
 *
 * Flags:
 *   --filter=<glob>        only diff files matching this substring (e.g. "presentation/mount")
 *   --round=<n>            round floats to N decimals (default: 4, 0 disables)
 *   --full                 also print raw unified diff per changed file
 *   --raw                  print raw `diff -ru` output, no formatting
 *
 * "Stable key" = the Tags[] field if present, else the first word of the line.
 * Compact summary costs ~150 tokens for the whole repo.
 */

import { spawnSync } from 'bun'
import { Glob } from 'bun'
import { join, relative } from 'path'
import { mkdtemp, rm } from 'fs/promises'

const ROOT = join(import.meta.dirname, '..')
const OUTPUT_DIR = join(ROOT, '.sandstone/output')
const PREV = join(ROOT, '.previous-builds')
const TEMP_DIR = join(ROOT, '.temp')

interface Options {
	filter: string | null
	round: number
	full: boolean
	raw: boolean
}

interface ParsedArgs {
	target: string | null // commit hash to compare against, null = HEAD
	opts: Options
}

// ---------- arg parsing ----------

const HASH_LIKE = /^[0-9a-f]{4,40}$/i

function parseArgs(argv: string[]): ParsedArgs {
	const opts: Options = {
		filter: null,
		round: 4,
		full: false,
		raw: false,
	}
	const positional: string[] = []
	for (const a of argv) {
		if (a.startsWith('--filter=')) opts.filter = a.slice('--filter='.length)
		else if (a.startsWith('--round=')) opts.round = Number(a.slice('--round='.length))
		else if (a === '--full') opts.full = true
		else if (a === '--raw') opts.raw = true
		else positional.push(a)
	}
	return { target: positional[0] ?? null, opts }
}

// ---------- commit resolution ----------

async function resolveTarget(arg: string | null): Promise<string> {
	// Verify .previous-builds is a git repo with commits
	const revCount = capture(['git', '-C', PREV, 'rev-list', '--count', 'HEAD'])
	if (revCount === '0') {
		console.error(`[diff-build] ${relative(ROOT, PREV)}/ has no commits. Run \`bun dev:history:generate\` first.`)
		process.exit(1)
	}

	if (arg === null) return capture(['git', '-C', PREV, 'rev-parse', 'HEAD'])

	// Try hash/prefix first (commit-ish: HEAD~1, b48a8eb, full sha, refs/...)
	if (HASH_LIKE.test(arg) || /^[~^]/.test(arg) || arg.includes('..')) {
		const tryParse = spawnSync(['git', '-C', PREV, 'rev-parse', '--verify', `${arg}^{commit}`])
		if (tryParse.success) return tryParse.stdout.toString().trim()
		// Fall through to substring search if hash-like but didn't resolve
		if (!HASH_LIKE.test(arg)) {
			console.error(`[diff-build] Bad commit-ish: ${arg}`)
			process.exit(1)
		}
	}

	// Substring search across all commit messages
	const needle = arg.toLowerCase()
	const log = capture(['git', '-C', PREV, 'log', '--format=%H %B', '-z'])
	const matches: { hash: string; subject: string }[] = []
	for (const block of log.split('\0')) {
		if (!block) continue
		const [hash, ...rest] = block.split(' ')
		const body = rest.join(' ')
		if (body.toLowerCase().includes(needle)) {
			matches.push({ hash, subject: body.split('\n')[0] })
		}
	}
	if (matches.length === 0) {
		console.error(`[diff-build] No commit found matching "${arg}"`)
		console.error(`[diff-build] Hint: use a hash/prefix (e.g. b48a8eb) or a substring of the message.`)
		process.exit(1)
	}
	if (matches.length > 1) {
		console.error(`[diff-build] "${arg}" matches ${matches.length} commits — be more specific:`)
		for (const m of matches) console.error(`  ${m.hash.slice(0, 7)}  ${m.subject}`)
		process.exit(1)
	}
	return matches[0].hash
}

// ---------- float normalization ----------

function normalizeFloats(text: string, decimals: number): string {
	if (decimals <= 0) return text
	const re = /(-?\d+)\.(\d+)f\b/g
	return text.replace(re, (_, intPart, fracPart) => {
		const rounded = parseFloat(`${intPart}.${fracPart}`).toFixed(decimals)
		return `${rounded}f`
	})
}

// ---------- stable key ----------

function stableKey(line: string): string {
	const tags = line.match(/Tags:\[([^\]]*)\]/)
	if (tags) {
		return tags[1]
			.split(',')
			.map(t => t.replace(/['\s]/g, ''))
			.filter(Boolean)
			.join(',')
	}
	const first = line.split(/\s+/, 1)[0] ?? ''
	return first.length > 40 ? first.slice(0, 40) + '…' : first
}

// ---------- helpers ----------

function capture(cmd: string[]): string {
	const proc = spawnSync(cmd)
	if (!proc.success) {
		console.error(`[diff-build] FAILED: ${cmd.join(' ')}\n${proc.stderr.toString()}`)
		process.exit(proc.exitCode ?? 1)
	}
	return proc.stdout.toString().trim()
}

async function exists(path: string): Promise<boolean> {
	try {
		const s = await Bun.file(path).stat()
		return s.isDirectory() || s.isFile()
	} catch {
		return false
	}
}

async function walk(dir: string): Promise<Map<string, string>> {
	const out = new Map<string, string>()
	if (!(await exists(dir))) return out
	const glob = new Glob('**/*')
	for await (const rel of glob.scan({ cwd: dir, onlyFiles: true })) {
		out.set(rel, join(dir, rel))
	}
	return out
}

// ---------- extraction ----------

async function extractBuild(hash: string, dest: string): Promise<void> {
	// git -C <PREV> archive <hash> | tar -x -C <dest>
	const sh = spawnSync(['sh', '-c', `git -C '${PREV}' archive ${hash} | tar -x -C '${dest}'`])
	if (!sh.success) {
		console.error(`[diff-build] git archive|tar failed: ${sh.stderr.toString()}`)
		process.exit(1)
	}
}

// ---------- diff hunks ----------

interface Change {
	oldLine?: string
	newLine?: string
}
interface Hunk {
	oldStart: number
	oldCount: number
	newStart: number
	newCount: number
	changes: Change[]
}

function parseDiff(diffOut: string): Hunk[] {
	const hunks: Hunk[] = []
	let current: Hunk | null = null
	for (const line of diffOut.split('\n')) {
		const m = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/)
		if (m) {
			current = {
				oldStart: Number(m[1]),
				oldCount: Number(m[2] ?? '1'),
				newStart: Number(m[3]),
				newCount: Number(m[4] ?? '1'),
				changes: [],
			}
			hunks.push(current)
			continue
		}
		if (!current) continue
		if (line.startsWith('---') || line.startsWith('+++')) continue
		if (line.startsWith('-')) current.changes.push({ oldLine: line.slice(1) })
		else if (line.startsWith('+')) current.changes.push({ newLine: line.slice(1) })
		else if (line.startsWith(' ')) {
			const t = line.slice(1)
			current.changes.push({ oldLine: t, newLine: t })
		}
	}
	return hunks
}

async function fileChanged(a: string, b: string, round: number): Promise<boolean> {
	const fa = Bun.file(a)
	const fb = Bun.file(b)
	if (fa.size !== fb.size) return true
	const aText = await fa.text()
	const bText = await fb.text()
	const aNorm = round > 0 ? normalizeFloats(aText, round) : aText
	const bNorm = round > 0 ? normalizeFloats(bText, round) : bText
	return aNorm !== bNorm
}

interface ChangedFile {
	path: string
	hunks: Hunk[]
	raw: string
}

interface DiffReport {
	added: string[]
	removed: string[]
	changed: ChangedFile[]
	total: number
}

async function computeDiff(
	leftDir: string,
	rightDir: string,
	round: number,
	filterSub: string | null,
): Promise<DiffReport> {
	const leftFiles = await walk(leftDir)
	const rightFiles = await walk(rightDir)
	const allPaths = new Set<string>([...leftFiles.keys(), ...rightFiles.keys()])

	const added: string[] = []
	const removed: string[] = []
	const changed: ChangedFile[] = []

	for (const rel of allPaths) {
		if (filterSub && !rel.includes(filterSub)) continue
		const left = leftFiles.get(rel)
		const right = rightFiles.get(rel)
		if (left && !right) removed.push(rel)
		else if (!left && right) added.push(rel)
		else if (left && right) {
			if (await fileChanged(left, right, round)) {
				const proc = spawnSync(['diff', '-u', left, right])
				const out = proc.stdout.toString()
				if (out) {
					const hunks = parseDiff(out)
					if (hunks.length) changed.push({ path: rel, hunks, raw: out })
				}
			}
		}
	}

	added.sort()
	removed.sort()
	changed.sort((a, b) => a.path.localeCompare(b.path))
	return { added, removed, changed, total: allPaths.size }
}

// ---------- output ----------

function printReport(label: string, report: DiffReport, opts: Options): void {
	if (opts.raw) {
		const proc = spawnSync(['diff', '-ruN', ...label.split(' → ')])
		process.stdout.write(proc.stdout)
		process.stdout.write(proc.stderr)
		return
	}

	const { added, removed, changed, total } = report
	const delta = added.length + removed.length + changed.length
	console.log(`\nDIFF ${label}: ${delta} of ${total} files changed`)

	if (added.length) {
		console.log(`\nADDED (${added.length}):`)
		for (const p of added) console.log(`  + ${p}`)
	}
	if (removed.length) {
		console.log(`\nREMOVED (${removed.length}):`)
		for (const p of removed) console.log(`  - ${p}`)
	}

	for (const { path, hunks } of changed) {
		console.log(`\n${path}  (${hunks.length} hunk${hunks.length === 1 ? '' : 's'})`)
		for (const h of hunks) {
			console.log(`  @@ -${h.oldStart} +${h.newStart} @@`)
			let newLine = h.newStart
			for (const c of h.changes) {
				if (c.oldLine !== undefined && c.newLine === undefined) {
					console.log(`    DEL L- ${stableKey(c.oldLine)}`)
				} else if (c.oldLine === undefined && c.newLine !== undefined) {
					console.log(`    ADD L${newLine} ${stableKey(c.newLine)}`)
					newLine++
				} else if (c.oldLine !== undefined && c.newLine !== undefined) {
					newLine++
				}
			}
		}
	}

	if (opts.full) {
		console.log('\n\n---FULL DIFF---')
		for (const { path, raw } of changed) {
			console.log(`\n=== ${path} ===`)
			console.log(raw)
		}
	}

	if (delta === 0) console.log('  (no changes)')
	console.log()
}

// ---------- main ----------

async function main() {
	const { target, opts } = parseArgs(process.argv.slice(2))

	// Verify .previous-builds is a git repo
	const isRepo = spawnSync(['git', '-C', PREV, 'rev-parse', '--git-dir'])
	if (!isRepo.success) {
		console.error(`[diff-build] ${relative(ROOT, PREV)}/ is not a git repo. Run \`git init\` inside it and \`bun dev:history:generate\`.`)
		process.exit(1)
	}

	if (!(await exists(OUTPUT_DIR))) {
		console.error(`[diff-build] ${OUTPUT_DIR} does not exist. Run \`bun dev:build\` first.`)
		process.exit(1)
	}

	const hash = await resolveTarget(target)
	const shortHash = hash.slice(0, 7)
	const subject = capture(['git', '-C', PREV, 'log', '-1', '--format=%s', hash])

	// Extract target build to a temp dir under .temp/ (gitignored).
	// Inner repo layout is `.previous-builds/output/{datapack,resourcepack}`
	// so the temp extraction has the build at `<tmpDir>/output/`.
	await Bun.$`mkdir -p ${TEMP_DIR}`.quiet()
	const tmpDir = await mkdtemp(join(TEMP_DIR, `diff-build-${shortHash}-`))
	try {
		await extractBuild(hash, tmpDir)
		const targetDir = join(tmpDir, 'output')
		const report = await computeDiff(targetDir, OUTPUT_DIR, opts.round, opts.filter)
		printReport(`'${shortHash}' (${subject}) → current`, report, opts)
	} finally {
		await rm(tmpDir, { recursive: true, force: true })
	}
}

main()