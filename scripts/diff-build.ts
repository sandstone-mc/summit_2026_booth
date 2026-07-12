#!/usr/bin/env bun
/**
 * Compact diff reporter for `.sandstone/output/` against saved snapshots.
 *
 * Usage:
 *   bun scripts/diff-build.ts snapshot [name]          # save current build as snapshot (default: "default")
 *   bun scripts/diff-build.ts check [name]             # diff current build vs named snapshot (default: "default")
 *   bun scripts/diff-build.ts all [name]               # snapshot → build → check
 *   bun scripts/diff-build.ts diff <from> <to>         # diff two named snapshots (no current build needed)
 *   bun scripts/diff-build.ts list                     # list all snapshots with size + mtime
 *   bun scripts/diff-build.ts delete <name>            # remove a snapshot
 *
 * Flags (for `check` / `all` / `diff`):
 *   --filter=<glob>        only diff files matching this substring (e.g. "presentation/mount")
 *   --round=<n>            round floats to N decimals to suppress FP noise (default: 4, 0 disables)
 *   --full                 also print raw unified diff per changed file
 *   --raw                  print raw `diff -ru` output, no formatting
 *
 * Output format (default, compact):
 *   DIFF: N of M files changed
 *     <relative-path>  (K hunks)
 *       @@ -oldStart +newStart @@
 *         DEL L- <stable-key>
 *         ADD L## <stable-key>
 *
 * "Stable key" = the Tags[] field if present, else the first word of the line.
 * Compact summary costs ~150 tokens for the whole repo.
 *
 * Snapshots are stored as `.previous-builds/<name>/` — one full copy of `.sandstone/output/`.
 * Snapshots with `--note=<text>` write a `.note` file inside for documentation.
 */

import { spawnSync } from 'bun'
import { Glob } from 'bun'
import { join, relative } from 'path'

const ROOT = join(import.meta.dirname, '..')
const OUTPUT_DIR = join(ROOT, '.sandstone/output')
const SNAPSHOTS_DIR = join(ROOT, '.previous-builds')

type Mode = 'snapshot' | 'check' | 'all' | 'diff' | 'list' | 'delete'

interface Options {
	filter: string | null
	round: number
	full: boolean
	raw: boolean
	note: string | null
}

interface ParsedArgs {
	mode: Mode
	name: string | null
	name2: string | null
	opts: Options
}

function parseArgs(argv: string[]): ParsedArgs {
	const args = [...argv]
	const mode = (args.shift() ?? 'check') as Mode

	// First positional = primary snapshot name, second = secondary (for `diff`)
	const positional = args.filter(a => !a.startsWith('--'))
	const name = positional[0] ?? null
	const name2 = positional[1] ?? null

	const get = (flag: string): string | null => {
		const i = args.findIndex(a => a.startsWith(flag))
		if (i === -1) return null
		const a = args[i]
		const eq = a.indexOf('=')
		return eq === -1 ? null : a.slice(eq + 1)
	}

	const opts: Options = {
		filter: get('--filter'),
		round: Number(get('--round') ?? '4'),
		full: args.includes('--full'),
		raw: args.includes('--raw'),
		note: get('--note'),
	}
	return { mode, name, name2, opts }
}

// ---------- float normalization (suppress FP noise) ----------

function normalizeFloats(text: string, decimals: number): string {
	if (decimals <= 0) return text
	const re = /(-?\d+)\.(\d+)f\b/g
	return text.replace(re, (_, intPart, fracPart) => {
		const rounded = parseFloat(`${intPart}.${fracPart}`).toFixed(decimals)
		return `${rounded}f`
	})
}

// ---------- stable key (for compact per-line reporting) ----------

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

// ---------- fs helpers ----------

async function exists(path: string): Promise<boolean> {
	try {
		const s = await Bun.file(path).stat()
		return s.isDirectory() || s.isFile()
	} catch {
		return false
	}
}

function validateName(name: string): void {
	if (!/^[a-zA-Z0-9_\-./]+$/.test(name)) {
		console.error(`[diff-build] Invalid snapshot name: ${name} (allowed: a-z 0-9 _ - . /)`)
		process.exit(1)
	}
	if (name.includes('..')) {
		console.error(`[diff-build] Snapshot name cannot contain '..'`)
		process.exit(1)
	}
}

async function snapshotDir(name: string): Promise<string> {
	validateName(name)
	const dir = join(SNAPSHOTS_DIR, name)
	await Bun.$`mkdir -p ${SNAPSHOTS_DIR}`.quiet()
	return dir
}

// ---------- snapshot ----------

async function snapshot(name: string, opts: Options): Promise<void> {
	if (!(await exists(OUTPUT_DIR))) {
		console.error(`[diff-build] ${OUTPUT_DIR} does not exist. Run \`bun dev:build\` first.`)
		process.exit(1)
	}
	const dir = await snapshotDir(name)
	spawnSync(['rm', '-rf', dir])
	const cp = spawnSync(['cp', '-r', OUTPUT_DIR, dir])
	if (!cp.success) {
		console.error(`[diff-build] cp failed: ${cp.stderr.toString()}`)
		process.exit(1)
	}
	if (opts.note) {
		await Bun.write(join(dir, '.note'), opts.note)
	}
	const fileCount = await countFiles(dir)
	console.log(`[diff-build] Snapshot '${name}' saved (${fileCount} files) → ${relative(ROOT, dir)}`)
}

async function countFiles(dir: string): Promise<number> {
	let n = 0
	const glob = new Glob('**/*')
	for await (const _ of glob.scan({ cwd: dir, onlyFiles: true })) n++
	return n
}

// ---------- file walking ----------

async function walk(dir: string): Promise<Map<string, string>> {
	const out = new Map<string, string>()
	if (!(await exists(dir))) return out
	const glob = new Glob('**/*')
	for await (const rel of glob.scan({ cwd: dir, onlyFiles: true })) {
		out.set(rel, join(dir, rel))
	}
	return out
}

// ---------- diff hunk parsing ----------

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

// ---------- comparison ----------

async function fileChanged(
	baselinePath: string,
	currentPath: string,
	round: number,
): Promise<boolean> {
	const a = Bun.file(baselinePath)
	const b = Bun.file(currentPath)
	if (a.size !== b.size) return true
	const aText = await a.text()
	const bText = await b.text()
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

// ---------- output formatting ----------

function printReport(label: string, report: DiffReport, opts: Options): void {
	if (opts.raw) {
		const proc = spawnSync(['diff', '-ruN', label.includes('→') ? label.split(' → ')[0] : label, label.includes('→') ? label.split(' → ')[1] : label])
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

// ---------- list ----------

async function listSnapshots(): Promise<void> {
	if (!(await exists(SNAPSHOTS_DIR))) {
		console.log('[diff-build] No snapshots yet.')
		return
	}
	const dirs: { name: string; mtime: number; size: number; note: string | null }[] = []
	for await (const entry of new Bun.Glob('*').scan({ cwd: SNAPSHOTS_DIR, onlyFiles: false })) {
		const full = join(SNAPSHOTS_DIR, entry)
		const stat = await Bun.file(full).stat()
		if (!stat.isDirectory()) continue
		const notePath = join(full, '.note')
		let note: string | null = null
		try {
			note = (await Bun.file(notePath).text()).trim() || null
		} catch {}
		dirs.push({ name: entry, mtime: stat.mtime.getTime(), size: stat.size, note })
	}
	dirs.sort((a, b) => b.mtime - a.mtime)

	console.log(`\nSnapshots in ${relative(ROOT, SNAPSHOTS_DIR)}/:`)
	for (const d of dirs) {
		const when = new Date(d.mtime).toISOString().replace('T', ' ').slice(0, 19)
		const noteStr = d.note ? `  — ${d.note}` : ''
		console.log(`  ${d.name.padEnd(20)} ${when}${noteStr}`)
	}
	console.log()
}

// ---------- delete ----------

async function deleteSnapshot(name: string): Promise<void> {
	const dir = await snapshotDir(name)
	if (!(await exists(dir))) {
		console.error(`[diff-build] Snapshot '${name}' does not exist`)
		process.exit(1)
	}
	spawnSync(['rm', '-rf', dir])
	console.log(`[diff-build] Deleted snapshot '${name}'`)
}

// ---------- entry point ----------

async function main() {
	const { mode, name, name2, opts } = parseArgs(process.argv.slice(2))

	if (mode === 'snapshot') {
		await snapshot(name ?? 'default', opts)
	} else if (mode === 'check') {
		const snapName = name ?? 'default'
		const dir = await snapshotDir(snapName)
		if (!(await exists(dir))) {
			console.error(
				`[diff-build] No snapshot '${snapName}' at ${relative(ROOT, dir)}. ` +
					`Run \`bun scripts/diff-build.ts snapshot${snapName === 'default' ? '' : ' ' + snapName}\` first.`,
			)
			process.exit(1)
		}
		const report = await computeDiff(dir, OUTPUT_DIR, opts.round, opts.filter)
		printReport(`'${snapName}' → current`, report, opts)
	} else if (mode === 'all') {
		const snapName = name ?? 'default'
		await snapshot(snapName, opts)
		const build = spawnSync(['bun', 'run', 'dev:build'], {
			stdin: 'inherit',
			stdout: 'inherit',
			stderr: 'inherit',
		})
		if (!build.success) {
			console.error('[diff-build] Build failed')
			process.exit(build.exitCode ?? 1)
		}
		const dir = await snapshotDir(snapName)
		const report = await computeDiff(dir, OUTPUT_DIR, opts.round, opts.filter)
		printReport(`'${snapName}' → current`, report, opts)
	} else if (mode === 'diff') {
		if (!name || !name2) {
			console.error('[diff-build] `diff` requires two names: diff <from> <to>')
			process.exit(1)
		}
		const fromDir = await snapshotDir(name)
		const toDir = await snapshotDir(name2)
		if (!(await exists(fromDir))) {
			console.error(`[diff-build] Snapshot '${name}' does not exist`)
			process.exit(1)
		}
		if (!(await exists(toDir))) {
			console.error(`[diff-build] Snapshot '${name2}' does not exist`)
			process.exit(1)
		}
		const report = await computeDiff(fromDir, toDir, opts.round, opts.filter)
		printReport(`'${name}' → '${name2}'`, report, opts)
	} else if (mode === 'list') {
		await listSnapshots()
	} else if (mode === 'delete') {
		if (!name) {
			console.error('[diff-build] `delete` requires a name')
			process.exit(1)
		}
		await deleteSnapshot(name)
	} else {
		console.error(`[diff-build] Unknown mode: ${mode}. Use snapshot|check|all|diff|list|delete.`)
		process.exit(1)
	}
}

main()