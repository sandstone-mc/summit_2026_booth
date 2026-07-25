import { join } from 'path'
import { createHash } from 'crypto'

import loadTag from '.sandstone/output/datapack/data/load/tags/function/load.json'

const repoRoot = join(import.meta.dirname, '..')
const outputDir = join(repoRoot, '.sandstone', 'output', 'resourcepack')
const cacheJsonPath = join(repoRoot, '.sandstone', 'cache.json')
const optipngManifestPath = join(repoRoot, '.sandstone', 'optipng.json')

// pngquant pass always runs when configured (no flag gate). Included
// globs in `resources/assets/color-tuning.json` decide which files get
// quantized; everything else is left as-is. Optipng runs on cache-miss
// files first so pngquant sees the deflated bytes.

const glob = new Bun.Glob('**/*.{json,mcmeta}')
let minified = 0

for await (const path of glob.scan(outputDir)) {
	const fullPath = join(outputDir, path)
	const raw = await Bun.file(fullPath).text()
	const compact = JSON.stringify(JSON.parse(raw))
	if (compact.length < raw.length) {
		await Bun.write(fullPath, compact)
		minified++
	}
}

if (minified > 0) console.log(`[minify] Compacted ${minified} JSON files in resourcepack`)

const pngGlob = new Bun.Glob('**/*.png')
const pngKeys: string[] = []
// `outputDir` is `.sandstone/output/resourcepack` but cache.json keys
// include the `resourcepack/` segment (Sandstone prefixes every entry
// with its output subdir). Prepend it so the manifest lookup matches.
for await (const path of pngGlob.scan(outputDir)) pngKeys.push(`resourcepack/${path}`)
if (pngKeys.length > 0) {
	const optipng = process.env.OPTIPNG_PATH ?? 'optipng'
	if (!Bun.which(optipng)) {
		console.error('[minify] optipng not found (install it or set OPTIPNG_PATH)')
		process.exit(1)
	}

	// Two manifests:
	//   - `.sandstone/cache.json` — Sandstone's per-build source hash map.
	//     We use it as the gate: an entry's hash only changes when the
	//     source content changes.
	//   - `.sandstone/optipng.json` — our record of per-pipeline completions:
	//       `files`       — source hash per png that has been optipng'd
	//       `tunedFiles`  — source hash per png that has been color-tuned
	//       `tuningStamp` — hash of the color-tuning config; mismatch forces
	//         every entry to re-tune without per-rule diffing
	type Manifest = {
		files?: Record<string, string>
		tunedFiles?: Record<string, string>
		tuningStamp?: string
	}
	const sandstoneHashes: Record<string, string> =
		(await Bun.file(cacheJsonPath).json().catch(() => ({})) as Manifest).files ?? {}
	const optipngManifest: Manifest = await Bun.file(optipngManifestPath).json().catch(() => ({}))
	const optipngHashes: Record<string, string> = optipngManifest.files ?? {}
	const tunedHashes: Record<string, string> = optipngManifest.tunedFiles ?? {}

	type PngEntry = { diskPath: string; key: string }

	// Read color-tuning config once for stamp invalidation + per-asset rules.
	const colorTuningPath = join(repoRoot, 'resources', 'assets', 'color-tuning.json')
	const tuningText = await Bun.file(colorTuningPath).text().catch(() => '{}')
	const tuningStamp = createHash('md5').update(tuningText).digest('hex')
	const stampMatches = optipngManifest.tuningStamp === tuningStamp

	// Stage 1: optipng — runs on cache misses (lossless, in-place).
	const toOptipng: PngEntry[] = []
	let cacheHits = 0
	for (const key of pngKeys) {
		const currentHash = sandstoneHashes[key]
		if (!currentHash) continue
		if (stampMatches && optipngHashes[key] === currentHash) {
			cacheHits++
			continue
		}
		toOptipng.push({ diskPath: join(outputDir, key.slice('resourcepack/'.length)), key })
	}
	if (toOptipng.length > 0) {
		const optipngProc = Bun.spawnSync([optipng, '-o7', '-quiet', ...toOptipng.map(t => t.diskPath)])
		if (!optipngProc.success) {
			console.error('[minify] optipng failed:', optipngProc.stderr.toString())
			process.exit(1)
		}
		for (const { key } of toOptipng) optipngHashes[key] = sandstoneHashes[key]!
	}

	// Stage 2: pngquant — opt-in via `--color-tune`. When enabled, runs on
	// every png that hasn't been color-tuned yet (or whose source hash
	// changed). `--quant-output` also forces a re-run on every png since
	// the output is a separate file the cache doesn't track.
	type PngquantSettings = {
		minQuality: number
		maxQuality: number
		maxColors: number
		speed: number
		skipIfLarger: boolean
		force: boolean
	}
	type ColorTuningConfig = {
		defaults?: Partial<PngquantSettings>
		include?: string[]
	}
	const tuning: ColorTuningConfig = JSON.parse(tuningText)

	const toPngquant: PngEntry[] = []
	const pngquant = process.env.PNGQUANT_PATH ?? 'pngquant'
	if (!Bun.which(pngquant)) {
		console.warn('[minify] pngquant not found (install it or set PNGQUANT_PATH) — skipping color tuning')
	} else {
		// Inclusion-list semantics: a png is quantized iff its cache
		// key matches at least one glob in `tuning.include`. No
		// per-rule settings — every quantized file uses `defaults`.
		const compiledIncludes = (tuning.include ?? []).map(match => ({
			glob: new Bun.Glob(match),
		}))
		function isIncluded(key: string): boolean {
			for (const { glob } of compiledIncludes) {
				if (glob.match(key)) return true
			}
			return false
		}

		for (const key of pngKeys) {
			const currentHash = sandstoneHashes[key]
			if (!currentHash) continue
			if (!isIncluded(key)) continue
			const diskPath = join(outputDir, key.slice('resourcepack/'.length))
			// Skip when the tuningStamp + source hash both still match —
			// the entry was already color-tuned under the current rules.
			if (stampMatches && tunedHashes[key] === currentHash) continue
			toPngquant.push({ diskPath, key })
		}

		if (toPngquant.length > 0) {
			// Single settings for the whole pass (defaults). No
			// bucketing — every file uses the same args.
			const def = tuning.defaults ?? {}
			const settings: PngquantSettings = {
				minQuality: def.minQuality ?? 85,
				maxQuality: def.maxQuality ?? 100,
				maxColors: def.maxColors ?? 256,
				speed: def.speed ?? 1,
				skipIfLarger: def.skipIfLarger ?? true,
				force: def.force ?? true,
			}
			const args = [
				`--quality=${settings.minQuality}-${settings.maxQuality}`,
				`--speed=${settings.speed}`,
				String(settings.maxColors),
				settings.skipIfLarger ? '--skip-if-larger' : '',
				settings.force ? '--force' : '',
				'--ext=.png',
				'--',
				...toPngquant.map(t => t.diskPath),
			]
			// pngquant returns a variety of non-zero exit codes for
			// non-fatal conditions (skip-if-larger → 25, etc.) and
			// sometimes emits nothing on real errors. Treat any exit
			// as non-fatal: log a warning and continue so one bad file
			// doesn't kill the build. `--skip-if-larger` prevents
			// overwrites either way.
			const pngquantProc = Bun.spawnSync([pngquant, ...args], { stdout: 'pipe', stderr: 'pipe' })
			if (pngquantProc.exitCode !== 0) {
				const err = pngquantProc.stderr.toString() || pngquantProc.stdout.toString() || '(no output)'
				console.warn(`[minify] pngquant exit ${pngquantProc.exitCode} (${toPngquant.length} files): ${err}`)
			}

			for (const { key } of toPngquant) tunedHashes[key] = sandstoneHashes[key]!
		}
	}

	// Persist manifest with both pipeline caches.
	const manifestBody: Manifest = { tuningStamp, files: optipngHashes, tunedFiles: tunedHashes }
	await Bun.write(optipngManifestPath, JSON.stringify(manifestBody, null, '\t') + '\n')

	const optimized = toOptipng.length
	const tuned = toPngquant.length
	const total = pngKeys.length
	if (optimized > 0 || cacheHits > 0 || tuned > 0) {
		console.log(`[minify] PNGs: ${optimized} optimized, ${tuned} color-tuned, ${cacheHits} cached (${total} total)`)
	}
}

const editedLoadTag = loadTag

editedLoadTag.values.splice(editedLoadTag.values.findIndex((func: string) => func === '__sandstone:ticked/start/wnylbycd'), 1)

if (process.env.SUMMIT_PROD === 'true') {
	Bun.file(join(import.meta.dirname, '../.sandstone/output/datapack/data/load/tags/function/load.json')).write(JSON.stringify(editedLoadTag))
}