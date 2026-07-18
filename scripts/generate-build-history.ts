#!/usr/bin/env bun
/**
 * Populate `.previous-builds/` git history by replaying builds since
 * "✨️ Initial auto-complete demo implementation" (a0840ca).
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
import { existsSync, mkdirSync } from 'fs'
import { join, relative } from 'path'

const ROOT = join(import.meta.dirname, '..')
const PREV = join(ROOT, '.previous-builds')
const SINCE = 'a0840ca' // ✨️ Initial auto-complete demo implementation

// ---------- helpers ----------

// Env for git commands targeting .previous-builds/. The ceiling stops git
// from walking up to the parent repo if .previous-builds/.git/ ever goes
// missing (would otherwise silently report parent-repo state).
const PREV_GIT_ENV = { ...process.env, GIT_CEILING_DIRECTORIES: ROOT }

// Locate git up-front so subsequent spawnSync calls don't fail with ENOENT
// on PATH-quirk environments. Bun.which respects PATH + exec lookup; fall
// back to common absolute locations if it returns null.
function resolveGit(): string {
	const found = Bun.which('git')
	if (found) return found
	for (const candidate of ['/usr/bin/git', '/usr/local/bin/git', '/opt/homebrew/bin/git']) {
		if (existsSync(candidate)) return candidate
	}
	console.error(`[history] git not found on PATH. Install git or add it to PATH and re-run.`)
	process.exit(1)
}
const GIT = resolveGit()

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

// Same as capture/run but targeting .previous-builds/ with the ceiling env.
function prevCapture(cmd: string[]): string {
	const proc = spawnSync(cmd, { cwd: PREV, env: PREV_GIT_ENV })
	if (!proc.success) {
		console.error(`[history] FAILED: ${cmd.join(' ')}\n${proc.stderr.toString()}`)
		process.exit(proc.exitCode ?? 1)
	}
	return proc.stdout.toString().trim()
}

function prevTryCapture(cmd: string[]): string | null {
	const proc = spawnSync(cmd, { cwd: PREV, env: PREV_GIT_ENV })
	return proc.success ? proc.stdout.toString().trim() : null
}

function prevRun(cmd: string[]): void {
	const proc = spawnSync(cmd, {
		cwd: PREV,
		env: PREV_GIT_ENV,
		stdin: 'inherit',
		stdout: 'inherit',
		stderr: 'inherit',
	})
	if (!proc.success) {
		console.error(`[history] FAILED: ${cmd.join(' ')}`)
		process.exit(proc.exitCode ?? 1)
	}
}

function step(label: string) {
	console.log(`\n[history] === ${label} ===`)
}

// ---------- main ----------

// If the user has `git checkout`'d a snapshot branch in .previous-builds/ to
// inspect it, return to main before any work. Idempotent.
async function returnPrevToMain(): Promise<void> {
	const branchRef = spawnSync([GIT, '-C', PREV, 'symbolic-ref', '--quiet', 'HEAD'], { env: PREV_GIT_ENV })
	if (!branchRef.success) return // detached HEAD — nothing to do
	const branch = branchRef.stdout.toString().trim().replace(/^refs\/heads\//, '')
	if (branch === 'main') return
	console.log(`[history] Restoring ${relative(ROOT, PREV)} from '${branch}' to 'main'...`)
	const r = spawnSync([GIT, '-C', PREV, 'checkout', 'main'], {
		env: PREV_GIT_ENV,
		stdout: 'inherit',
		stderr: 'inherit',
	})
	if (!r.success) {
		console.error(`[history] Failed to restore ${relative(ROOT, PREV)} to main`)
		console.log(r.stderr)
		process.exit(1)
	}
}

// Auto-bootstrap .previous-builds so the user can run this script on a fresh
// clone with no manual setup. After this returns:
//   - The directory exists
//   - It is a git repo with a `main` branch
//   - HEAD points to an empty initial commit (so `git log` is safe)
function ensurePrevRepo(): void {
	if (!existsSync(PREV)) {
		console.log(`[history] Creating ${relative(ROOT, PREV)}/`)
		mkdirSync(PREV, { recursive: true })
	}

	const gitDir = spawnSync([GIT, '-C', PREV, 'rev-parse', '--git-dir'], { env: PREV_GIT_ENV })
	if (!gitDir.success) {
		console.log(`[history] Initializing git repo in ${relative(ROOT, PREV)}/`)
		const init = spawnSync([GIT, '-C', PREV, 'init', '-b', 'main'], {
			env: PREV_GIT_ENV,
			stdout: 'inherit',
			stderr: 'inherit',
		})
		if (!init.success) {
			console.error(`[history] git init failed`)
			process.exit(1)
		}
	}

	// If the repo exists but has no commits (fresh `git init`), seed an empty
	// commit on main. Without this, `git log` in the next step exits 128 with
	// "your current branch 'main' does not have any commits yet".
	const head = spawnSync([GIT, '-C', PREV, 'rev-parse', '--verify', 'HEAD'], { env: PREV_GIT_ENV })
	if (!head.success) {
		console.log(`[history] Seeding empty initial commit in ${relative(ROOT, PREV)}/`)
		const seed = spawnSync([GIT, '-C', PREV, 'commit', '--allow-empty', '-m', 'Initial snapshot'], {
			env: PREV_GIT_ENV,
			stdout: 'inherit',
			stderr: 'inherit',
		})
		if (!seed.success) {
			console.error(`[history] Initial commit failed`)
			process.exit(1)
		}
	}
}

async function main() {
	// Auto-bootstrap .previous-builds: create dir, init repo, seed an empty
	// commit on `main` if no commits yet. After this, `git log` is safe.
	ensurePrevRepo()

	// If the user has `git checkout`'d a snapshot branch in .previous-builds/
	// to inspect it, return to main before we run — otherwise our cp/commit
	// operations could touch their snapshot.
	await returnPrevToMain()

	// Collect commits since SINCE (inclusive), oldest-first
	const raw = capture([GIT, 'rev-list', `${SINCE}^..HEAD`, '--reverse'])
	const commits = raw.split('\n').filter(Boolean)
	if (!commits.length) {
		console.error(`[history] No commits found in range ${SINCE}^..HEAD`)
		process.exit(1)
	}

	// Skip already-processed source commits (idempotency for re-runs).
	// Each inner commit's message contains `Source commit: <hash>`. Tolerate
	// an empty log (e.g. freshly-seeded repo with no inner commits yet).
	const processed = new Set<string>()
	const prevLog = prevTryCapture([GIT, 'log', '--format=%B', '-z'])
	if (prevLog) {
		for (const block of prevLog.split('\0')) {
			const m = block.match(/Source commit: ([a-f0-9]+)/)
			if (m) processed.add(m[1])
		}
	}
	const pending = commits.filter(h => !processed.has(h))
	if (!pending.length) {
		console.log(`[history] All ${commits.length} commits already processed. Nothing to do.`)
		return
	}
	if (processed.size) console.log(`[history] Skipping ${processed.size} already-processed commit${processed.size === 1 ? '' : 's'}`)

	// Snapshot parent repo state for restore. Strip refs/heads/ so
	// `git checkout <name>` re-attaches HEAD instead of staying detached.
	const originalHead = capture([GIT, 'rev-parse', 'HEAD'])
	const branchRef = tryCapture([GIT, 'symbolic-ref', '--quiet', 'HEAD']) // "refs/heads/<name>" or null
	const branchName = branchRef?.replace(/^refs\/heads\//, '') ?? null
	const restoreTarget = branchName ?? originalHead

	const dirty = capture([GIT, 'status', '--porcelain'])
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
		const r = spawnSync([GIT, 'checkout', restoreTarget], {
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
			const subject = capture([GIT, 'log', '-1', '--format=%s', hash])
			const date = capture([GIT, 'log', '-1', '--format=%ci', hash])
			const author = capture([GIT, 'log', '-1', '--format=%an <%ae>', hash])

			step(`[${i + 1}/${pending.length}] ${hash.slice(0, 7)} — ${subject}`)

			// Per-iteration preamble
			run(['rm', '-rf', 'node_modules'])
			run(['bun', 'install'])
			run(['rm', '-rf', join(PREV, 'output', 'datapack'), join(PREV, 'output', 'resourcepack')])

			// Checkout source commit in parent repo
			run([GIT, 'checkout', hash])

			// Build (FORCE_RENDER already set in run() env)
			run(['bun', 'run', 'dev:build'])

			// Copy fresh build output into .previous-builds (`.` on src copies contents, not the dir itself)
			run(['cp', '-r', join('.sandstone', 'output', '.'), PREV])

			// Commit inside .previous-builds
			const message = `Build ${hash.slice(0, 7)}: ${subject}\n\nSource commit: ${hash}\nSource author: ${author}\nSource date: ${date}`
			prevRun([GIT, 'add', '-A'])
			prevRun([GIT, 'commit', '--allow-empty', '-m', message])
		}
	} finally {
		restore()
	}

	const finalCount = prevCapture([GIT, 'rev-list', '--count', 'HEAD'])
	console.log(`\n[history] Done. ${finalCount} commit${finalCount === '1' ? '' : 's'} in ${relative(ROOT, PREV)}/`)
}

main()