#!/usr/bin/env bun
/**
 * Diff `.sandstone/output/` against builds stored in `.previous-builds/`'s git history.
 *
 * Usage:
 *   bun scripts/diff-build.ts                          # HEAD vs current (pending changes)
 *   bun scripts/diff-build.ts <commit-ish|hash|substr> # that commit vs current
 *   bun scripts/diff-build.ts <arg1> <arg2>            # commit1 vs commit2
 *   bun scripts/diff-build.ts snapshot <name>          # save current build as branch <name>
 *
 * Each diff-arg resolves in this order (first match wins):
 *   1. `@<name>` (or single-quoted `'@"<name>"'` for names with spaces)
 *      → snapshot branch `refs/heads/<name>`
 *   2. `git rev-parse --verify`  → HEAD, HEAD~1, main, full SHA, refs/...
 *   3. Hash/prefix `[0-9a-f]{4,40}` in `.previous-builds/`
 *   4. Case-insensitive substring of any inner commit's message body
 *      (errors if zero or >1 matches)
 *
 * Quote substrings containing spaces in the shell, e.g.
 *   bun dev:diff:check "scrolling code" "fix regression"
 * Without quotes the shell splits them into separate args.
 *
 * Snapshots: `bun dev:diff:snapshot <name>` copies `.sandstone/output/`
 * into `.previous-builds/`, commits it, and force-creates/moves branch
 * `<name>`. Idempotent — running again updates the branch.
 *
 * Flags:
 *   --filter=<glob>        only diff files matching this substring (e.g. "presentation/mount")
 *   --round=<n>            round floats to N decimals (default: 4, 0 disables)
 *   --full                 also print raw unified diff per changed file
 *   --raw                  print raw `diff -ru` output, no formatting
 *   --script=<path>        replace the default reporter with a custom
 *                          bun script invoked as
 *                            bun <path> <leftDir> <rightDir>
 *                          (left/right are the resolved build dirs)
 *                          and the DiffReport piped in as JSON on stdin.
 *                          Report shape:
 *                            { added: string[], removed: string[],
 *                              changed: ChangedFile[], total: number }
 *                          where ChangedFile = { path, hunks, raw }.
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

// Git commands targeting `.previous-builds/` must not walk up to the
// parent repo if `.previous-builds/.git/` is ever missing. Setting the
// ceiling to the project root stops the lookup at this boundary.
const GIT_ENV = { ...process.env, GIT_CEILING_DIRECTORIES: ROOT }

interface Options {
	filter: string | null
	round: number
	full: boolean
	raw: boolean
	script: string | null // path to a custom script that replaces the default reporter
}

interface ParsedArgs {
	// 0 args: compare HEAD vs current. 1 arg: compare that vs current. 2 args: compare two commits.
	positional: string[]
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
		script: null,
	}
	const positional: string[] = []
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i]
		if (a.startsWith('--filter=')) opts.filter = a.slice('--filter='.length)
		else if (a.startsWith('--round=')) opts.round = Number(a.slice('--round='.length))
		else if (a.startsWith('--script=')) opts.script = a.slice('--script='.length)
		else if (a === '--script') { opts.script = argv[++i]; continue }
		else if (a === '--full') opts.full = true
		else if (a === '--raw') opts.raw = true
		else positional.push(a)
	}
	if (positional.length > 2) {
		console.error(`[diff-build] Too many positional args (max 2). Got: ${positional.join(' ')}`)
		console.error(`[diff-build] Tip: quote substrings containing spaces, e.g. \`bun dev:diff:check "fix regression" "scrolling code"\`.`)
		process.exit(1)
	}
	return { positional, opts }
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

	// Snapshot reference: @<name> or @"<name>" → resolve refs/heads/<name>.
	// The shell strips quotes from @"..." so both forms arrive as strings
	// starting with @. The quoted form is needed for names containing
	// spaces (which must be single-quoted in the shell so they stay as
	// one arg): `bun dev:diff:check '@"name with spaces"'`.
	if (arg.startsWith('@') && arg.length >= 2) {
		const name = arg.startsWith('@"') && arg.endsWith('"') ? arg.slice(2, -1) : arg.slice(1)
		if (!name) {
			console.error(`[diff-build] Empty snapshot name in ${arg}`)
			process.exit(1)
		}
		validateSnapshotName(name)
		const tryParse = spawnSync(['git', '-C', PREV, 'rev-parse', '--verify', `refs/heads/${name}^{commit}`], { env: GIT_ENV })
		if (!tryParse.success) {
			console.error(`[diff-build] No snapshot branch '${name}' exists in ${relative(ROOT, PREV)}/`)
			console.error(`[diff-build] List: \`git -C ${relative(ROOT, PREV)} branch\``)
			process.exit(1)
		}
		return tryParse.stdout.toString().trim()
	}

	// Try commit-ish resolution first (HEAD, HEAD~1, main, full sha, refs/...).
	// For source-commit hashes (which only exist in the parent repo), this
	// fails with the ceiling env, and we fall through to substring search
	// where the source hash is embedded in the inner commit's message.
	const tryParse = spawnSync(['git', '-C', PREV, 'rev-parse', '--verify', `${arg}^{commit}`], { env: GIT_ENV })
	if (tryParse.success) return tryParse.stdout.toString().trim()

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

// All `git` commands in this script target `.previous-builds/`. The ceiling
// env stops discovery from walking up to the parent repo.
function capture(cmd: string[]): string {
	const proc = spawnSync(cmd, { env: GIT_ENV })
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
	const sh = spawnSync(['sh', '-c', `git -C '${PREV}' archive ${hash} | tar -x -C '${dest}'`], { env: GIT_ENV })
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

// ---------- snapshot ----------

function validateSnapshotName(name: string): void {
	if (!/^[a-zA-Z0-9_\-./]+$/.test(name)) {
		console.error(`[diff-build] Invalid snapshot name: ${name} (allowed: a-z 0-9 _ - . /)`)
		process.exit(1)
	}
	if (name.includes('..') || name.startsWith('/') || name.endsWith('/')) {
		console.error(`[diff-build] Snapshot name cannot contain '..' or start/end with '/'`)
		process.exit(1)
	}
}

async function runSnapshot(name: string): Promise<void> {
	validateSnapshotName(name)

	const isRepo = spawnSync(['git', '-C', PREV, 'rev-parse', '--git-dir'], { env: GIT_ENV })
	if (!isRepo.success) {
		console.error(`[diff-build] ${relative(ROOT, PREV)}/ is not a git repo. Run \`git init\` inside it and \`bun dev:history:generate\`.`)
		process.exit(1)
	}

	// Need at least one commit (HEAD exists) so the new branch has somewhere to point.
	const headExists = capture(['git', '-C', PREV, 'rev-parse', '--verify', 'HEAD'])
	if (!headExists) {
		console.error(`[diff-build] ${relative(ROOT, PREV)}/ has no commits yet. Run \`bun dev:history:generate\` first.`)
		process.exit(1)
	}

	if (!(await exists(OUTPUT_DIR))) {
		console.error(`[diff-build] ${OUTPUT_DIR} does not exist. Run \`bun dev:build\` first.`)
		process.exit(1)
	}

	// Copy current build into .previous-builds/ (same convention as generator).
	await Bun.$`mkdir -p ${TEMP_DIR}`.quiet()
	const cp = spawnSync(['sh', '-c', `rm -rf '${PREV}/output' && cp -r '${OUTPUT_DIR}/' '${PREV}/'`], { env: GIT_ENV })
	if (!cp.success) {
		console.error(`[diff-build] cp failed: ${cp.stderr.toString()}`)
		process.exit(1)
	}

		// Build the snapshot commit WITHOUT advancing HEAD. Use git plumbing:
	//   1. `add -A` stages the new files in the index
	//   2. `write-tree` materializes the staged tree
	//   3. `commit-tree` creates a commit pointing at that tree + parent HEAD
	//      (returns the new commit's SHA without touching any branch)
	//   4. `update-ref refs/heads/<name>` moves (or creates) the snapshot
	//      branch directly to the new commit.
	// This way HEAD stays on `main` (or wherever it was) and the snapshot
	// commit lives only on its dedicated branch.
	const message = `Snapshot: ${name}`
	const add = spawnSync(['git', '-C', PREV, 'add', '-A'], { env: GIT_ENV, stdout: 'inherit', stderr: 'inherit' })
	if (!add.success) process.exit(add.exitCode ?? 1)
	const tree = capture(['git', '-C', PREV, 'write-tree'])
	const newHash = capture(['git', '-C', PREV, 'commit-tree', tree, '-p', 'HEAD', '-m', message])
	const updateRef = spawnSync(['git', '-C', PREV, 'update-ref', `refs/heads/${name}`, newHash], { env: GIT_ENV })
	if (!updateRef.success) {
		console.error(`[diff-build] Failed to create branch ${name}`)
		process.exit(updateRef.exitCode ?? 1)
	}

	console.log(`[diff-build] Snapshot '${name}' saved at ${newHash.slice(0, 7)} (branch refs/heads/${name})`)
	console.log(`[diff-build] Compare later with: bun dev:diff:check @"${name}"`)
}

// ---------- main ----------

// If the user has `git checkout`'d a snapshot branch in .previous-builds/ to
// inspect it, return to main before we do any work. Without this, a snapshot
// or check run might write into the user's checkout (clobbering their working
// tree) or even get confused about which branch is "current". Idempotent.
async function returnPrevToMain(): Promise<void> {
	const branchRef = spawnSync(['git', '-C', PREV, 'symbolic-ref', '--quiet', 'HEAD'], { env: GIT_ENV })
	if (!branchRef.success) return // detached HEAD — nothing to do
	const branch = branchRef.stdout.toString().trim().replace(/^refs\/heads\//, '')
	if (branch === 'main') return
	console.log(`[diff-build] Restoring ${relative(ROOT, PREV)} from '${branch}' to 'main'...`)
	const r = spawnSync(['git', '-C', PREV, 'checkout', 'main'], {
		env: GIT_ENV,
		stdout: 'inherit',
		stderr: 'inherit',
	})
	if (!r.success) {
		console.error(`[diff-build] Failed to restore ${relative(ROOT, PREV)} to main`)
		console.log(r.stderr)
		process.exit(1)
	}
}

interface Side {
	kind: 'current' | 'commit'
	hash: string | null // null when kind === 'current'
	subject: string
}

async function resolveSide(arg: string): Promise<Side> {
	const hash = await resolveTarget(arg)
	const subject = capture(['git', '-C', PREV, 'log', '-1', '--format=%s', hash])
	return { kind: 'commit', hash, subject }
}

function labelFor(side: Side): string {
	if (side.kind === 'current') return 'current'
	return `'${side.hash!.slice(0, 7)}' (${side.subject})`
}

async function buildDirFor(side: Side, tempDirs: string[]): Promise<string> {
	if (side.kind === 'current') return OUTPUT_DIR
	const short = side.hash!.slice(0, 7)
	const dir = await mkdtemp(join(TEMP_DIR, `diff-build-${short}-`))
	tempDirs.push(dir)
	await extractBuild(side.hash!, dir)
	return join(dir, 'output')
}

async function main() {
	const argv = process.argv.slice(2)

	// If the user has `git checkout`'d a snapshot branch in .previous-builds/
	// to inspect it, return to main before we run — otherwise our snapshot
	// write-back (or the user's continued editing) would touch their snapshot.
	await returnPrevToMain()

	if (argv[0] === 'snapshot') {
		const name = argv[1]
		if (!name) {
			console.error(`[diff-build] snapshot requires a name: bun dev:diff:snapshot <name>`)
			process.exit(1)
		}
		await runSnapshot(name)
		return
	}

	const { positional, opts } = parseArgs(argv)

	// Verify .previous-builds is a git repo
	const isRepo = spawnSync(['git', '-C', PREV, 'rev-parse', '--git-dir'], { env: GIT_ENV })
	if (!isRepo.success) {
		console.error(`[diff-build] ${relative(ROOT, PREV)}/ is not a git repo. Run \`git init\` inside it and \`bun dev:history:generate\`.`)
		process.exit(1)
	}

	if (!(await exists(OUTPUT_DIR))) {
		console.error(`[diff-build] ${OUTPUT_DIR} does not exist. Run \`bun dev:build\` first.`)
		process.exit(1)
	}

	await Bun.$`mkdir -p ${TEMP_DIR}`.quiet()

	// Resolve the two sides. 0 args → HEAD vs current; 1 arg → arg vs current;
	// 2 args → arg1 vs arg2. Quote substrings containing spaces in the shell
	// (e.g. `bun dev:diff:check "scrolling code" "fix regression"`).
	const [leftArg, rightArg] =
		positional.length === 0 ? [null, ''] :
		positional.length === 1 ? [positional[0], ''] :
		[positional[0], positional[1]]

	const left: Side = leftArg === null
		? { kind: 'commit', hash: capture(['git', '-C', PREV, 'rev-parse', 'HEAD']), subject: capture(['git', '-C', PREV, 'log', '-1', '--format=%s', 'HEAD']) }
		: await resolveSide(leftArg)
	const right: Side = rightArg === ''
		? { kind: 'current', hash: null, subject: 'current' }
		: await resolveSide(rightArg)

	const tempDirs: string[] = []
	try {
		const leftDir = await buildDirFor(left, tempDirs)
		const rightDir = await buildDirFor(right, tempDirs)
		const report = await computeDiff(leftDir, rightDir, opts.round, opts.filter)
		if (opts.script) {
			// Custom reporter receives the build dirs as positional args and
			// the DiffReport as JSON on stdin. The DiffReport shape is:
			//   { added: string[], removed: string[], changed: ChangedFile[],
			//     total: number }
			//   ChangedFile = { path: string, hunks: Hunk[], raw: string }
			const scriptPath = opts.script.startsWith('/') ? opts.script : join(ROOT, opts.script)
			const r = spawnSync(['bun', scriptPath, leftDir, rightDir], {
				stdin: Buffer.from(JSON.stringify(report)),
				stdout: 'inherit',
				stderr: 'inherit',
			})
			if (!r.success) process.exit(r.exitCode ?? 1)
		} else {
			printReport(`${labelFor(left)} → ${labelFor(right)}`, report, opts)
		}
	} finally {
		await Promise.all(tempDirs.map(d => rm(d, { recursive: true, force: true })))
	}
}

main()