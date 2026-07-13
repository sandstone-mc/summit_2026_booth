// FontLoader — owns per-font char-width tables and the load pipeline
// (font JSON → walk providers → measure bitmaps → merge space advances).

import { BitmapMeasurer, EMPTY_GLYPH_MIN_Y, type GlyphMetrics } from './bitmap'
import { DefaultFontSource, LocalFontSource } from './sources'
import type { BitmapProvider, FontJson, FontProvider } from './types'

// Font-level metrics derived from measured glyph pixels. `cellHeight`
// and `ascent` come straight from the last bitmap processed (Mojang's
// `accented` provider for the default font — 12px tall, ascent=10);
// the measured ascender / descender are worst-case across every glyph
// in every bitmap the font chain reaches.
//
// `measuredDescenderFraction` is the key value for layout: it's the
// worst-case (descender depth / cell height) ratio across all bitmaps.
// Multiply by `(scalePx / 16)` to get descender depth in world blocks
// at any given text scale. Tracking the FRACTION (not raw pixels)
// avoids a cellHeight / measuredDescenderPx mismatch when bitmaps
// of different sizes are present in the same font (default font has
// 8px ascii + 8px nonlatin + 12px accented).
export type FontMetrics = {
	cellHeight: number
	ascent: number
	measuredAscenderPx: number
	measuredDescenderPx: number
	measuredDescenderFraction: number
}

// Walks a font's provider chain and merges every reachable bitmap /
// space provider into `widthsOut`. Also aggregates per-font vertical
// metrics into `metricsOut` from each bitmap encountered. `bitmapLoader`
// resolves a bitmap `file` ref to PNG bytes; `referenceLoader` resolves
// an `@import`-style reference to another font JSON (or null if missing).
async function applyProviders(
	jsonBytes: Buffer,
	widthsOut: Map<string, number>,
	metricsOut: FontMetrics,
	bitmapLoader: (file: string) => Promise<Buffer>,
	referenceLoader: (id: string) => Promise<Buffer | null>,
	measurer: BitmapMeasurer,
): Promise<void> {
	const fontJSON: FontJson = JSON.parse(jsonBytes.toString('utf8'))
	for (const p of fontJSON.providers) {
		await applyProvider(p, widthsOut, metricsOut, bitmapLoader, referenceLoader, measurer)
	}
}

async function applyProvider(
	p: FontProvider,
	widthsOut: Map<string, number>,
	metricsOut: FontMetrics,
	bitmapLoader: (file: string) => Promise<Buffer>,
	referenceLoader: (id: string) => Promise<Buffer | null>,
	measurer: BitmapMeasurer,
): Promise<void> {
	if (p.type === 'bitmap') {
		await applyBitmap(p, widthsOut, metricsOut, () => bitmapLoader(p.file), measurer)
	} else if (p.type === 'reference') {
		const refBytes = await referenceLoader(p.id)
		if (refBytes)
			await applyProviders(refBytes, widthsOut, metricsOut, bitmapLoader, referenceLoader, measurer)
	} else if (p.type === 'space') {
		// Space providers supply explicit advances (mostly for chars not
		// in any bitmap). +1 inter-char spacing to match MC.
		for (const [ch, advance] of Object.entries(p.advances)) {
			widthsOut.set(ch, advance + 1)
		}
	}
}

async function applyBitmap(
	bitmap: BitmapProvider,
	widthsOut: Map<string, number>,
	metricsOut: FontMetrics,
	loader: () => Promise<Buffer>,
	measurer: BitmapMeasurer,
): Promise<void> {
	const { cellHeight, glyphs } = await measurer.measure(bitmap, await loader())

	// Forward widths to the existing width table.
	for (const [ch, m] of glyphs) widthsOut.set(ch, m.width)

	// Aggregate vertical extent for this bitmap. Cell height is the
	// MEASURED value (PNG height / chars.length) — the JSON `height` field
	// is unreliable (defaults to 8 when omitted, but the actual Mojang
	// default-font ASCII bitmap is 16px tall per cell). Pixels at y=0 are
	// at the top of the cell, y=cellH-1 at the bottom. MC's `ascent` field
	// is the number of pixels ABOVE the baseline; baseline row is at
	// y=ascent-1 (the last ascent row), and pixels strictly below it are
	// at y=ascent..cellH-1. Descender depth = pixels below baseline.
	// Track as a FRACTION of cell height so we can combine with bitmaps
	// of different sizes correctly.
	for (const [, m] of glyphs) {
		if (m.minY === EMPTY_GLYPH_MIN_Y) continue
		// `ascent` and `cellHeight` come from the LAST bitmap seen; this
		// matches what the font JSON declares as the canonical line metrics.
		metricsOut.ascent = bitmap.ascent
		metricsOut.cellHeight = cellHeight
		if (m.minY < metricsOut.measuredAscenderPx) metricsOut.measuredAscenderPx = m.minY
		const descenderDepth = Math.max(0, m.maxY - (bitmap.ascent - 1))
		if (descenderDepth > metricsOut.measuredDescenderPx) metricsOut.measuredDescenderPx = descenderDepth
		if (cellHeight > 0) {
			const fraction = descenderDepth / cellHeight
			if (fraction > metricsOut.measuredDescenderFraction) {
				metricsOut.measuredDescenderFraction = fraction
			}
		}
	}
}

export const DEFAULT_FONT_ID = 'minecraft:default'

export class FontLoader {
	private widths = new Map<string, Map<string, number>>()
	private metrics = new Map<string, FontMetrics>()
	private loaded = new Set<string>()
	private measurer = new BitmapMeasurer()
	private defaultSource = new DefaultFontSource()
	private localSource = new LocalFontSource()

	// One-time init for `fontId`. Subsequent calls are no-ops. Must be
	// awaited before `charWidth` / `textWidth` / `fontMetrics` for that font.
	async load(fontId: string = DEFAULT_FONT_ID): Promise<void> {
		if (this.loaded.has(fontId)) return
		const widths = new Map<string, number>()
		const fontMetrics: FontMetrics = {
			cellHeight: 0,
			ascent: 0,
			measuredAscenderPx: Number.POSITIVE_INFINITY,
			measuredDescenderPx: 0,
			measuredDescenderFraction: 0,
		}
		if (fontId === DEFAULT_FONT_ID) {
			await this.loadDefault(widths, fontMetrics)
		} else {
			await this.loadCustom(fontId, widths, fontMetrics)
		}
		// Sentinel: if no bitmap was reachable, leave the ascender at
		// +Infinity (callers can detect). Most fonts have at least one
		// bitmap, so this is purely defensive.
		if (fontMetrics.measuredAscenderPx === Number.POSITIVE_INFINITY) {
			fontMetrics.measuredAscenderPx = 0
		}
		this.widths.set(fontId, widths)
		this.metrics.set(fontId, fontMetrics)
		this.loaded.add(fontId)
	}

	private async loadDefault(
		widths: Map<string, number>,
		fontMetrics: FontMetrics,
	): Promise<void> {
		const referenceLoader = async (id: string): Promise<Buffer | null> => {
			const [ns, ...rest] = id.split(':')
			if (ns !== 'minecraft') return null
			return await this.defaultSource.fetchToCache(`font/${rest.join(':')}.json`)
		}
		const bitmapLoader = async (file: string): Promise<Buffer> => {
			const [ns, ...rest] = file.split(':')
			if (ns !== 'minecraft') throw new Error(`text-metrics: non-minecraft bitmap ref ${file} in default font`)
			return await this.defaultSource.fetchToCache(`textures/${rest.join(':')}`)
		}
		const json = await this.defaultSource.fetchToCache('font/default.json')
		await applyProviders(json, widths, fontMetrics, bitmapLoader, referenceLoader, this.measurer)
	}

	private async loadCustom(
		fontId: string,
		widths: Map<string, number>,
		fontMetrics: FontMetrics,
	): Promise<void> {
		const referenceLoader = async (id: string): Promise<Buffer | null> =>
			this.localSource.readJsonIfExists(id)
		const bitmapLoader = async (file: string): Promise<Buffer> => this.localSource.readBitmap(file)
		const json = this.localSource.readJson(fontId)
		await applyProviders(json, widths, fontMetrics, bitmapLoader, referenceLoader, this.measurer)
	}

	// Width of one char in the named font's bitmap pixels. Bold adds 1px.
	charWidth(ch: string, bold: boolean, fontId: string = DEFAULT_FONT_ID): number {
		const widths = this.widths.get(fontId)
		if (!widths) {
			throw new Error(
				`text-metrics: charWidth(${JSON.stringify(ch)}, ${bold}, ${fontId}) called before loadFontMetrics(${fontId})`,
			)
		}
		const w = widths.get(ch) ?? 7 // MISSING_CHAR_WIDTH
		return bold ? w + 1 : w
	}

	// Total width of `text` in bitmap pixels.
	textWidth(text: string, bold: boolean, fontId: string = DEFAULT_FONT_ID): number {
		let w = 0
		for (const ch of text) w += this.charWidth(ch, bold, fontId)
		return w
	}

	// Font-level vertical metrics — `cellHeight` (bitmap cell height in
	// pixels), `ascent` (from font JSON), and the worst-case measured
	// ascender / descender in pixels aggregated across every reachable
	// bitmap. Throws if the font wasn't pre-loaded via `load()`.
	fontMetrics(fontId: string = DEFAULT_FONT_ID): FontMetrics {
		const m = this.metrics.get(fontId)
		if (!m) {
			throw new Error(
				`text-metrics: fontMetrics(${fontId}) called before loadFontMetrics(${fontId})`,
			)
		}
		return m
	}
}