// Per-glyph advance widths for any font available to the JSX renderer.
//
// Each font renders its own char widths — using default-font widths to
// pre-compute wrap for a `<code>` block that actually renders in
// monocraft would silently disagree with what `text_display` draws. So
// the metrics table is keyed by font ID (`<namespace>:<name>`) and the
// renderer asks for the font it intends to render in.
//
// Default Minecraft font: fetched from misode/mcmeta's `assets` branch
// (a frequently-updated mirror of MC's bundled resources). Cached at
// `.sandstone/cache/font/` so the network only happens on first build.
//
// Custom fonts (anything under `resources/resourcepack/assets/<ns>/font/`):
// read from the local resourcepack folder so the user can drop in any
// font they ship and have it Just Work for `<code>` and any other
// element. Their bitmap PNGs are loaded from
// `resources/resourcepack/assets/<ns>/textures/...` the same way MC
// resolves them at runtime.
//
// Widths are in the font's bitmap pixels. `text_display.line_width` is
// also in those pixels, so wrap math and NBT stay in the same unit.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

const CACHE_DIR = join(process.cwd(), '.sandstone', 'cache', 'font')
const RESOURCES_DIR = join(process.cwd(), 'resources', 'resourcepack', 'assets')

// misode/mcmeta's `assets` branch tracks MC's latest bundled resources.
const MCMETA_BASE = 'https://raw.githubusercontent.com/misode/mcmeta/assets/assets'

// MC's advance for characters not present in any bitmap provider. Matches
// the "average char width" MC uses for missing glyphs in
// `BitmapProvider.GlyphInfo` for the default font.
const MISSING_CHAR_WIDTH = 7

export const DEFAULT_FONT_ID = 'minecraft:default'

// fontId → char → width in that font's bitmap pixels
const fontWidths = new Map<string, Map<string, number>>()
const loadedFonts = new Set<string>()

// ── Asset fetching / loading ─────────────────────────────────────

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

/**
 * Resolve an MC resource location (`minecraft:include/default`) to the
 * local font JSON path inside the user's resourcepack directory
 * (`<cwd>/resources/resourcepack/assets/minecraft/font/include/default.json`).
 */
function localFontJsonPath(fontId: string): string {
	const [ns, ...rest] = fontId.split(':')
	if (!ns) throw new Error(`text-metrics: invalid font ID ${fontId}`)
	return join(RESOURCES_DIR, ns, 'font', `${rest.join(':')}.json`)
}

/**
 * Resolve a bitmap provider's `file` field (`minecraft:font/ascii.png`)
 * to the matching PNG inside `resources/resourcepack/assets/.../textures/...`.
 */
function localBitmapPngPath(file: string): string {
	const [ns, ...rest] = file.split(':')
	if (!ns) throw new Error(`text-metrics: invalid bitmap file ref ${file}`)
	return join(RESOURCES_DIR, ns, 'textures', ...rest)
}

// ── Font JSON model ──────────────────────────────────────────────

interface BitmapProvider {
	type: 'bitmap'
	file: string
	chars: string[]
	height?: number
	ascent: number
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

// ── PNG measurement ──────────────────────────────────────────────

/**
 * Measure every glyph in a single bitmap PNG. Walks the `chars` rows;
 * for each char finds the rightmost non-transparent column in its cell,
 * then adds +1 for inter-character spacing (matches MC's advance).
 *
 * Different rows can use different cell widths (nonlatin_european and
 * ascii providers use different layouts), so the cell size is computed
 * per row from the row's `chars.length`.
 */
async function measureBitmap(
	bitmap: BitmapProvider,
	pngBytes: Buffer,
	out: Map<string, number>,
): Promise<void> {
	const { data, info } = await sharp(pngBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

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

/**
 * Apply a bitmap provider's glyphs into `out`. For default font the PNG
 * comes from the misode cache; for custom fonts it's a local read.
 */
async function applyBitmap(
	bitmap: BitmapProvider,
	out: Map<string, number>,
	loader: () => Promise<Buffer>,
): Promise<void> {
	const png = await loader()
	await measureBitmap(bitmap, png, out)
}

/**
 * Walk a font's provider chain (loaded from `jsonBytes`) and merge every
 * reachable bitmap / space provider into `out`. `bitmapLoader` resolves
 * a bitmap `file` ref to PNG bytes — pass a default-font loader or a
 * local-resource loader depending on the source.
 */
async function applyProviders(
	jsonBytes: Buffer,
	out: Map<string, number>,
	bitmapLoader: (file: string) => Promise<Buffer>,
	referenceLoader: (id: string) => Promise<Buffer | null>,
): Promise<void> {
	const fontJSON: FontJson = JSON.parse(jsonBytes.toString('utf8'))
	for (const p of fontJSON.providers) {
		if (p.type === 'bitmap') {
			await applyBitmap(p, out, () => bitmapLoader(p.file))
		} else if (p.type === 'reference') {
			const refBytes = await referenceLoader(p.id)
			if (refBytes) await applyProviders(refBytes, out, bitmapLoader, referenceLoader)
		} else if (p.type === 'space') {
			// Space providers supply explicit advances (mostly for chars
			// not in any bitmap). +1 inter-char spacing to match MC.
			for (const [ch, advance] of Object.entries(p.advances)) {
				out.set(ch, advance + 1)
			}
		}
	}
}

// ── Default font load (misode/mcmeta) ────────────────────────────

async function loadDefaultFont(): Promise<void> {
	const widths = new Map<string, number>()

	const referenceLoader = async (id: string): Promise<Buffer | null> => {
		// Default-font references resolve under minecraft/.
		const [ns, ...rest] = id.split(':')
		if (ns !== 'minecraft') return null
		return await fetchToCache(`font/${rest.join(':')}.json`)
	}

	const bitmapLoader = async (file: string): Promise<Buffer> => {
		const [ns, ...rest] = file.split(':')
		if (ns !== 'minecraft') throw new Error(`text-metrics: non-minecraft bitmap ref ${file} in default font`)
		return await fetchToCache(`textures/${rest.join(':')}`)
	}

	await applyProviders(await fetchToCache('font/default.json'), widths, bitmapLoader, referenceLoader)
	fontWidths.set(DEFAULT_FONT_ID, widths)
}

// ── Custom font load (local resources/resourcepack) ──────────────

async function loadCustomFont(fontId: string): Promise<void> {
	const jsonPath = localFontJsonPath(fontId)
	if (!existsSync(jsonPath)) {
		throw new Error(
			`text-metrics: custom font ${fontId} not found at ${jsonPath} — ` +
				`add it under resources/resourcepack/assets/<namespace>/font/`,
		)
	}
	const jsonBytes = readFileSync(jsonPath)

	const widths = new Map<string, number>()

	const referenceLoader = async (id: string): Promise<Buffer | null> => {
		const path = localFontJsonPath(id)
		return existsSync(path) ? readFileSync(path) : null
	}

	const bitmapLoader = async (file: string): Promise<Buffer> => {
		const path = localBitmapPngPath(file)
		if (!existsSync(path)) {
			throw new Error(`text-metrics: font bitmap ${file} not found at ${path}`)
		}
		return readFileSync(path)
	}

	await applyProviders(jsonBytes, widths, bitmapLoader, referenceLoader)
	fontWidths.set(fontId, widths)
}

// ── Public API ───────────────────────────────────────────────────

/**
 * One-time init: load the named font and populate its widths table.
 * Defaults to Minecraft's built-in font. Subsequent calls with the same
 * `fontId` are no-ops. Safe to call from many entry points — module
 * state is shared.
 *
 * Must be awaited before `wrapLines` / `charWidth` for that font. The
 * render entry points (`render`, `renderSlides`) preload every font
 * they reference before emitting MCFunctions.
 */
export async function loadFontMetrics(fontId: string = DEFAULT_FONT_ID): Promise<void> {
	if (loadedFonts.has(fontId)) return
	if (fontId === DEFAULT_FONT_ID) {
		await loadDefaultFont()
	} else {
		await loadCustomFont(fontId)
	}
	loadedFonts.add(fontId)
}

/** Width of one char in the named font's bitmap pixels. Bold adds 1px (matches MC). */
export function charWidth(ch: string, bold: boolean, fontId: string = DEFAULT_FONT_ID): number {
	const widths = fontWidths.get(fontId)
	if (!widths) {
		throw new Error(
			`text-metrics: charWidth(${JSON.stringify(ch)}, ${bold}, ${fontId}) called before loadFontMetrics(${fontId})`,
		)
	}
	const w = widths.get(ch) ?? MISSING_CHAR_WIDTH
	return bold ? w + 1 : w
}

/** Total width of `text` in the named font's bitmap pixels. */
export function textWidth(text: string, bold: boolean, fontId: string = DEFAULT_FONT_ID): number {
	let w = 0
	for (const ch of text) w += charWidth(ch, bold, fontId)
	return w
}

/**
 * Wrap `text` to the named font's pixel limits and return the actual
 * lines (not just a count) so callers can post-process them — e.g.
 * `<code>` borders prefix every line with `│ ` after wrapping at a
 * width that already accounts for the prefix. Behavior matches
 * `wrapLines` exactly; this is just an array-returning twin.
 *
 * Leading whitespace on each source line is captured before the
 * whitespace-split tokenization (which would otherwise eat it) and
 * re-prepended to the first wrapped line of that group. Continuation
 * lines from a single over-long source line are NOT indented — they
 * come from char-wrap inside one word.
 */
export function wrapToLines(
	text: string,
	lineWidth: number,
	bold: boolean,
	fontId: string = DEFAULT_FONT_ID,
): string[] {
	if (lineWidth <= 0) return text ? [text] : ['']

	const out: string[] = []
	for (const sourceLine of text.split('\n')) {
		const m = sourceLine.match(/^([ \t]*)([\s\S]*)$/)
		const leading = m ? m[1] : ''
		const body = m ? m[2] : sourceLine

		const words = body.split(/\s+/).filter(Boolean)
		if (words.length === 0) {
			out.push('')
			continue
		}

		const spaceW = charWidth(' ', bold, fontId)
		const lines: string[] = []
		let currentWidth = 0
		let currentLine: string[] = []

		const flush = () => {
			if (currentLine.length) {
				lines.push(currentLine.join(' '))
				currentLine = []
				currentWidth = 0
			}
		}

		for (const word of words) {
			const wordWidth = textWidth(word, bold, fontId)

			// Word wider than the line — char-wrap across multiple lines.
			if (wordWidth > lineWidth) {
				flush()
				let chunk = ''
				let chunkWidth = 0
				for (const ch of word) {
					const cw = charWidth(ch, bold, fontId)
					if (chunkWidth + cw > lineWidth && chunk) {
						lines.push(chunk)
						chunk = ch
						chunkWidth = cw
					} else {
						chunk += ch
						chunkWidth += cw
					}
				}
				if (chunk) {
					currentLine = [chunk]
					currentWidth = chunkWidth
				}
				continue
			}

			// Normal word: try to fit on current line, otherwise wrap.
			if (currentLine.length === 0) {
				currentLine = [word]
				currentWidth = wordWidth
			} else if (currentWidth + spaceW + wordWidth <= lineWidth) {
				currentLine.push(word)
				currentWidth += spaceW + wordWidth
			} else {
				flush()
				currentLine = [word]
				currentWidth = wordWidth
			}
		}
		flush()
		if (lines.length === 0) lines.push('')

		// Restore this source line's leading whitespace on its first
		// continuation line (this is where indent should appear).
		if (lines[0] !== undefined) lines[0] = leading + lines[0]
		out.push(...lines)
	}

	return out.length > 0 ? out : ['']
}

/**
 * Array-returning variant of `wrapCodeLines`: preserves `\n` breaks,
 * wraps each source line independently, and returns the resulting
 * strings. Empty source lines yield one empty string each.
 */
export function wrapCodeLinesAsArray(
	text: string,
	lineWidth: number,
	bold: boolean,
	fontId: string = DEFAULT_FONT_ID,
): string[] {
	const sources = text.split('\n')
	const out: string[] = []
	for (const line of sources) {
		if (line.length === 0) {
			out.push('')
		} else {
			out.push(...wrapToLines(line, lineWidth, bold, fontId))
		}
	}
	return out
}

/**
 * Number of visual lines `text` occupies when word-wrapped to `lineWidth`
 * pixels of the named font. Matches MC's text_display behavior closely:
 *
 * - Words split on whitespace, accumulated left-to-right per line.
 * - A word that won't fit on the current line starts a new line.
 * - A word wider than `lineWidth` itself gets char-wrapped across
 *   multiple lines (long URLs, code snippets, etc.).
 * - `bold=true` adds 1px per char (MC's actual bold behavior).
 */
/**
 * Wrap-aware line count for multi-line code: preserves the source's
 * `\n` breaks, char-wraps any line wider than `lineWidth` itself, and
 * counts one visual line per blank source line.
 */
export function wrapCodeLines(
	text: string,
	lineWidth: number,
	bold: boolean,
	fontId: string = DEFAULT_FONT_ID,
): number {
	const sources = text.split('\n')
	let total = 0
	for (const line of sources) {
		total += line.length === 0 ? 1 : wrapLines(line, lineWidth, bold, fontId)
	}
	return Math.max(1, total)
}

export function wrapLines(
	text: string,
	lineWidth: number,
	bold: boolean,
	fontId: string = DEFAULT_FONT_ID,
): number {
	if (lineWidth <= 0) return 1
	return Math.max(1, wrapToLines(text, lineWidth, bold, fontId).length)
}