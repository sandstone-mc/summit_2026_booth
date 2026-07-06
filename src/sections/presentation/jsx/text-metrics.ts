// Text metrics for Minecraft's default font. Used at build time to figure
// out how tall a text_display will be after it wraps, so the layout
// pre-allocates enough vertical space for every paragraph.
//
// Why dynamic: MC's default font is a bitmap font. Each glyph lives in an
// 8×8 cell on a 128×128 PNG; the rightmost filled column in that cell is
// the glyph's advance (plus 1px of inter-character spacing). Hardcoding
// the advances loses characters whose widths differ from MC's reference
// table (italic, custom fonts, future MC updates) and silently disagrees
// with what `text_display` actually renders.
//
// We pull the font JSON + ASCII PNG from the misode/mcmeta `assets` branch
// (a frequently-updated mirror of MC's bundled resources) and measure
// each glyph ourselves. Files are cached at `.sandstone/cache/font/` so
// the network only happens on the first build (or after a cache wipe).
//
// Widths are in default-font pixels (scale 1) — `line_width` is also in
// default-font pixels, so the comparison is apples-to-apples.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

const CACHE_DIR = join(process.cwd(), '.sandstone', 'cache', 'font')

// misode/mcmeta's `assets` branch tracks MC's latest bundled resources.
// We pin to the `assets` branch tip — the user explicitly accepted "use
// the latest files" rather than matching a specific MC version commit.
const MCMETA_BASE = 'https://raw.githubusercontent.com/misode/mcmeta/assets/assets'

// MC's advance for characters not present in any bitmap provider. Matches
// the "average char width" MC uses for missing glyphs in
// `BitmapProvider.GlyphInfo` for the default font.
const MISSING_CHAR_WIDTH = 7

// Module-level cache. Populated by `loadFontMetrics`; consumed by
// `charWidth` / `wrapLines`. Module state is intentional — text-metrics
// is a build-time singleton.
const widths = new Map<string, number>()
let loaded = false

// ── Asset fetching ──────────────────────────────────────────────

async function fetchToCache(relPath: string): Promise<Buffer> {
	const cached = join(CACHE_DIR, relPath)
	if (existsSync(cached)) return readFileSync(cached)
	const url = `${MCMETA_BASE}/minecraft/${relPath}`
	const res = await fetch(url)
	if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`)
	const buf = Buffer.from(await res.arrayBuffer())
	mkdirSync(dirname(cached), { recursive: true })
	writeFileSync(cached, buf)
	return buf
}

// ── Font JSON model + reference resolution ──────────────────────

interface BitmapProvider {
	type: 'bitmap'
	file: string
	chars: string[]
	height?: number
	ascent: number
	// Width in pixels of each cell. Per-row entries (one per chars row)
	// because different bitmap providers (nonlatin_european, ascii, etc.)
	// use different cell sizes.
	rowWidths?: number[]
}

interface ReferenceProvider {
	type: 'reference'
	id: string
	filter?: { uniform?: boolean }
}

interface SpaceProvider {
	type: 'space'
	advances: Record<string, number>
}

type FontProvider = BitmapProvider | ReferenceProvider | SpaceProvider

interface FontJson {
	providers: FontProvider[]
}

// Map an MC font JSON resource location (`minecraft:include/default`) to
// its misode cache path (`include/default.json`).
function fontJsonRelPath(id: string): string {
	const [ns, ...rest] = id.split(':')
	if (ns !== 'minecraft') {
		throw new Error(`text-metrics: only minecraft font providers supported, got ${id}`)
	}
	return `${rest.join(':')}.json`
}

// Map a bitmap provider's `file` field (`minecraft:font/ascii.png`) to
// the texture path it lives at in MC's `textures/` tree.
function bitmapPngRelPath(file: string): string {
	const [ns, ...rest] = file.split(':')
	if (ns !== 'minecraft') {
		throw new Error(`text-metrics: only minecraft bitmap providers supported, got ${file}`)
	}
	return `textures/${rest.join(':')}`
}

/**
 * Walk a font's provider chain, returning every bitmap provider reachable
 * through `reference` links. PNG files are downloaded as needed. The
 * result is the *providers*, not pixel data — callers iterate to find
 * the one whose PNG they want, then decode it.
 */
async function loadProviders(jsonAssetPath: string, visited = new Set<string>()): Promise<BitmapProvider[]> {
	if (visited.has(jsonAssetPath)) return []
	visited.add(jsonAssetPath)
	const fontJSON: FontJson = JSON.parse((await fetchToCache(jsonAssetPath)).toString('utf8'))
	const bitmaps: BitmapProvider[] = []
	for (const p of fontJSON.providers) {
		if (p.type === 'bitmap') {
			bitmaps.push(p)
		} else if (p.type === 'reference') {
			// Cross-reference IDs are font-tree-relative; prepend `font/`
			// to get the asset path fetchToCache expects.
			const assetRel = `font/${fontJsonRelPath(p.id)}`
			bitmaps.push(...(await loadProviders(assetRel, visited)))
		}
		// space providers contribute explicit advance widths for chars
		// not covered by any bitmap — we ignore them and let the
		// fallback kick in (it matches MC's behavior closely enough).
	}
	return bitmaps
}

// ── PNG decoding → per-glyph advance table ──────────────────────

/**
 * Measure every glyph in a single bitmap: walk the `chars` rows, for each
 * char find the rightmost non-transparent column in its 8×8 cell, then
 * add +1 for inter-character spacing (matches animated-java's
 * BitmapFontProvider, which mirrors MC's advance behavior).
 *
 * PNG is decoded via `sharp` (already a project dep) into raw RGBA so we
 * can scan alpha cheaply without a Canvas.
 */
async function measureBitmap(
	bitmap: BitmapProvider,
	pngFile: string,
	out: Map<string, number>,
): Promise<void> {
	const relPath = bitmapPngRelPath(pngFile)
	const png = await fetchToCache(relPath)
	const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

	const rowCount = bitmap.chars.length
	const cellH = info.height / rowCount
	for (let row = 0; row < rowCount; row++) {
		const chars = bitmap.chars[row]
		const cellW = info.width / chars.length
		const startY = row * cellH
		for (let col = 0; col < chars.length; col++) {
			const startX = col * cellW
			let maxX = -1
			for (let y = 0; y < cellH; y++) {
				for (let x = 0; x < cellW; x++) {
					const i = ((startY + y) * info.width + (startX + x)) * 4
					if (data[i + 3] > 0 && x > maxX) maxX = x
				}
			}
			// Transparent cell → fallback. Otherwise: rightmost filled
			// column + 1 (exclusive end) + 1 (inter-char spacing).
			out.set(chars[col], maxX < 0 ? MISSING_CHAR_WIDTH : maxX + 2)
		}
	}
}

// ── Public API ──────────────────────────────────────────────────

/**
 * One-time init: download the MC default font (default.json + its
 * referenced includes + the ascii.png bitmap), measure every glyph, and
 * populate the module-level widths table. Subsequent calls return
 * instantly. Safe to call from multiple entry points — module state is
 * shared across all importers in the build.
 *
 * Must be awaited before `wrapLines` / `charWidth` are called — those
 * throw if metrics aren't loaded yet. Render entry points (`render`,
 * `renderSlides`) await this before emitting any MCFunction.
 */
export async function loadFontMetrics(): Promise<void> {
	if (loaded) return

	// Resolve every bitmap provider reachable from `default.json`. Then
	// pick the one whose file is ascii.png — that's the standard ASCII
	// glyph table.
	const providers = await loadProviders('font/default.json')
	const asciiProvider = providers.find((p) => p.file.endsWith('ascii.png'))
	if (!asciiProvider) {
		throw new Error('text-metrics: could not find an ascii.png bitmap provider in default.json')
	}

	widths.clear()
	await measureBitmap(asciiProvider, asciiProvider.file, widths)
	loaded = true
}

/** Width of one char in default-font pixels. Bold adds 1px (matches MC). */
export function charWidth(ch: string, bold: boolean): number {
	if (!loaded) {
		throw new Error(
			'text-metrics: charWidth() called before loadFontMetrics() — await loadFontMetrics() in your render entry point',
		)
	}
	const w = widths.get(ch) ?? MISSING_CHAR_WIDTH
	return bold ? w + 1 : w
}

/** Total width of `text` in default-font pixels. */
export function textWidth(text: string, bold: boolean): number {
	let w = 0
	for (const ch of text) w += charWidth(ch, bold)
	return w
}

/**
 * Number of visual lines `text` occupies when word-wrapped to `lineWidth`
 * default-font pixels. Matches MC's text_display behavior closely:
 *
 * - Words split on whitespace, accumulated left-to-right per line.
 * - A word that won't fit on the current line starts a new line.
 * - A word wider than `lineWidth` itself gets char-wrapped across
 *   multiple lines (long URLs, code snippets, etc.).
 * - `bold=true` adds 1px per char (MC's actual bold behavior).
 */
export function wrapLines(text: string, lineWidth: number, bold: boolean): number {
	if (lineWidth <= 0) return 1
	const words = text.split(/\s+/).filter(Boolean)
	if (words.length === 0) return 1

	const spaceW = charWidth(' ', bold)
	let lines = 1
	let currentWidth = 0

	for (const word of words) {
		const wordWidth = textWidth(word, bold)

		// Word wider than the line — char-wrap across multiple lines.
		if (wordWidth > lineWidth) {
			if (currentWidth > 0) {
				lines++
				currentWidth = 0
			}
			let chunkWidth = 0
			for (const ch of word) {
				const cw = charWidth(ch, bold)
				if (chunkWidth + cw > lineWidth) {
					lines++
					chunkWidth = 0
				}
				chunkWidth += cw
			}
			currentWidth = chunkWidth
			continue
		}

		// Normal word: try to fit on current line, otherwise wrap.
		const fits =
			currentWidth === 0 ? wordWidth <= lineWidth : currentWidth + spaceW + wordWidth <= lineWidth
		if (fits) {
			currentWidth = currentWidth === 0 ? wordWidth : currentWidth + spaceW + wordWidth
		} else {
			lines++
			currentWidth = wordWidth
		}
	}

	return lines
}