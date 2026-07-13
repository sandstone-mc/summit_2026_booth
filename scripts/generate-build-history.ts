#!/usr/bin/env bun
/**
 * Populate `.previous-builds/` git history by replaying builds since
 * "✨️ Add output diff tracking" (b48a8eb0).
 *
 * For each source commit in that range, oldest-first:
 *   1. rm -rf node_modules/
 *   2. bun install
 *   3. rm -rf .previous-builds/datapack .previous-builds/resourcepack
 *   4. git checkout <hash>             (in parent repo)
 *   5. FORCE_RENDER=1 bun dev:build
 *   6. cp -r .sandstone/output/. .previous-builds/
 *   7. Inside .previous-builds/: git add -A && git commit -m "..."
 *
 * Restores the parent repo's HEAD/branch on exit (even on failure).
 *
 * Requirements:
 *   - `.previous-builds/` is already a git repo (`git init` inside it).
 *   - Parent repo working tree is clean (no uncommitted/staged changes).
 */

import { spawnSync } from 'bun'
import { join, relative } from 'path'

const ROOT = join(import.meta.dirname, '..')
const PREV = join(ROOT, '.previous-builds')
const SINCE = 'b48a8eb0' // ✨️ Add output diff tracking

// ---------- helpers ----------

function run(cmd: string[], opts: { cwd?: string } = {}): void {
	const proc = spawnSync(cmd, {
		cwd: opts.cwd ?? ROOT,
		stdin: 'inherit',
		stdout: 'inherit',
		stderr: 'inherit',
		env: { ...process.env, FORCE_RENDER: '1' },
	})
	if (!proc.success) {
		console.error(`[history] FAILED: ${cmd.join(' ')}`)
		process.exit(proc.exitCode ?? 1)
	}
}

function capture(cmd: string[], opts: { cwd?: string } = {}): string {
	const proc = spawnSync(cmd, { cwd: opts.cwd ?? ROOT })
	if (!proc.success) {
		console.error(`[history] FAILED: ${cmd.join(' ')}\n${proc.stderr.toString()}`)
		process.exit(proc.exitCode ?? 1)
	}
	return proc.stdout.toString().trim()
}

function tryCapture(cmd: string[], opts: { cwd?: string } = {}): string | null {
	const proc = spawnSync(cmd, { cwd: opts.cwd ?? ROOT })
	return proc.success ? proc.stdout.toString().trim() : null
}

function step(label: string) {
	console.log(`\n[history] === ${label} ===`)
}

// ---------- main ----------

async function main() {
	// Verify .previous-builds is a git repo
	const isRepo = tryCapture(['git', 'rev-parse', '--git-dir'], { cwd: PREV })
	if (isRepo === null) {
		console.error(`[history] ${relative(ROOT, PREV)}/ is not a git repo. Run \`git init\` inside it first.`)
		process.exit(1)
	}

	// Collect commits since SINCE (inclusive), oldest-first
	const raw = capture(['git', 'rev-list', `${SINCE}^..HEAD`, '--reverse'])
	const commits = raw.split('\n').filter(Boolean)
	if (!commits.length) {
		console.error(`[history] No commits found in range ${SINCE}^..HEAD`)
		process.exit(1)
	}

	// Skip already-processed source commits (idempotency for re-runs).
	// Each inner commit's message contains `Source commit: <hash>`.
	const processed = new Set<string>()
	const prevLog = capture(['git', 'log', '--format=%B', '-z'], { cwd: PREV })
	for (const block of prevLog.split('\0')) {
		const m = block.match(/Source commit: ([a-f0-9]+)/)
		if (m) processed.add(m[1])
	}
	const pending = commits.filter(h => !processed.has(h))
	if (!pending.length) {
		console.log(`[history] All ${commits.length} commits already processed. Nothing to do.`)
		return
	}
	if (processed.size) console.log(`[history] Skipping ${processed.size} already-processed commit${processed.size === 1 ? '' : 's'}`)

	// Snapshot parent repo state for restore. Strip refs/heads/ so
	// `git checkout <name>` re-attaches HEAD instead of staying detached.
	const originalHead = capture(['git', 'rev-parse', 'HEAD'])
	const branchRef = tryCapture(['git', 'symbolic-ref', '--quiet', 'HEAD']) // "refs/heads/<name>" or null
	const branchName = branchRef?.replace(/^refs\/heads\//, '') ?? null
	const restoreTarget = branchName ?? originalHead

	const dirty = capture(['git', 'status', '--porcelain'])
	if (dirty) {
		console.error(`[history] Parent repo has uncommitted changes. Commit or stash them first:\n${dirty}`)
		process.exit(1)
	}

	console.log(`[history] Replaying ${pending.length} commits (${pending[0].slice(0, 7)}..${pending.at(-1)!.slice(0, 7)})`)
	console.log(`[history] Parent HEAD will be restored to: ${restoreTarget}`)

	let restored = false
	const restore = () => {
		if (restored) return
		restored = true
		console.log(`\n[history] Restoring parent HEAD to ${restoreTarget}...`)
		const r = spawnSync(['git', 'checkout', restoreTarget], {
			stdin: 'inherit',
			stdout: 'inherit',
			stderr: 'inherit',
		})
		if (!r.success) console.error(`[history] WARNING: failed to restore HEAD to ${restoreTarget}`)
	}
	process.on('SIGINT', () => { restore(); process.exit(130) })
	process.on('SIGTERM', () => { restore(); process.exit(143) })

	try {
		for (let i = 0; i < pending.length; i++) {
			const hash = pending[i]
			const subject = capture(['git', 'log', '-1', '--format=%s', hash])
			const date = capture(['git', 'log', '-1', '--format=%ci', hash])
			const author = capture(['git', 'log', '-1', '--format=%an <%ae>', hash])

			step(`[${i + 1}/${pending.length}] ${hash.slice(0, 7)} — ${subject}`)

			// Per-iteration preamble
			run(['rm', '-rf', 'node_modules'])
			run(['bun', 'install'])
			run(['rm', '-rf', join(PREV, 'output', 'datapack'), join(PREV, 'output', 'resourcepack')])

			// Checkout source commit in parent repo
			run(['git', 'checkout', hash])

			// Build (FORCE_RENDER already set in run() env)
			run(['bun', 'run', 'dev:build'])

			// Copy fresh build output into .previous-builds (`.` on src copies contents, not the dir itself)
			run(['cp', '-r', join('.sandstone', 'output', '.'), PREV])

			// Commit inside .previous-builds
			const message = `Build ${hash.slice(0, 7)}: ${subject}\n\nSource commit: ${hash}\nSource author: ${author}\nSource date: ${date}`
			const add = spawnSync(['git', 'add', '-A'], { cwd: PREV, stdout: 'inherit', stderr: 'inherit' })
			if (!add.success) {
				console.error(`[history] git add failed for ${hash}`)
				process.exit(add.exitCode ?? 1)
			}
			const commit = spawnSync(['git', 'commit', '--allow-empty', '-m', message], {
				cwd: PREV,
				stdin: 'inherit',
				stdout: 'inherit',
				stderr: 'inherit',
			})
			if (!commit.success) {
				console.error(`[history] Commit failed for ${hash}`)
				process.exit(commit.exitCode ?? 1)
			}
		}
	} finally {
		restore()
	}

	const finalCount = capture(['git', 'rev-list', '--count', 'HEAD'], { cwd: PREV })
	console.log(`\n[history] Done. ${finalCount} commit${finalCount === '1' ? '' : 's'} in ${relative(ROOT, PREV)}/`)
}

main()