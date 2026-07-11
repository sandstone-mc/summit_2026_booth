// FontLoader — owns per-font char-width tables and the load pipeline
// (font JSON → walk providers → measure bitmaps → merge space advances).

import { BitmapMeasurer } from './bitmap'
import { DefaultFontSource, LocalFontSource } from './sources'
import type { BitmapProvider, FontJson, FontProvider } from './types'

// Walks a font's provider chain and merges every reachable bitmap /
// space provider into `out`. `bitmapLoader` resolves a bitmap `file`
// ref to PNG bytes; `referenceLoader` resolves an `@import`-style
// reference to another font JSON (or null if missing).
async function applyProviders(
	jsonBytes: Buffer,
	out: Map<string, number>,
	bitmapLoader: (file: string) => Promise<Buffer>,
	referenceLoader: (id: string) => Promise<Buffer | null>,
	measurer: BitmapMeasurer,
): Promise<void> {
	const fontJSON: FontJson = JSON.parse(jsonBytes.toString('utf8'))
	for (const p of fontJSON.providers) {
		await applyProvider(p, out, bitmapLoader, referenceLoader, measurer)
	}
}

async function applyProvider(
	p: FontProvider,
	out: Map<string, number>,
	bitmapLoader: (file: string) => Promise<Buffer>,
	referenceLoader: (id: string) => Promise<Buffer | null>,
	measurer: BitmapMeasurer,
): Promise<void> {
	if (p.type === 'bitmap') {
		await applyBitmap(p, out, () => bitmapLoader(p.file), measurer)
	} else if (p.type === 'reference') {
		const refBytes = await referenceLoader(p.id)
		if (refBytes) await applyProviders(refBytes, out, bitmapLoader, referenceLoader, measurer)
	} else if (p.type === 'space') {
		// Space providers supply explicit advances (mostly for chars not
		// in any bitmap). +1 inter-char spacing to match MC.
		for (const [ch, advance] of Object.entries(p.advances)) {
			out.set(ch, advance + 1)
		}
	}
}

async function applyBitmap(
	bitmap: BitmapProvider,
	out: Map<string, number>,
	loader: () => Promise<Buffer>,
	measurer: BitmapMeasurer,
): Promise<void> {
	const png = await loader()
	await measurer.measure(bitmap, png, out)
}

export const DEFAULT_FONT_ID = 'minecraft:default'

export class FontLoader {
	private widths = new Map<string, Map<string, number>>()
	private loaded = new Set<string>()
	private measurer = new BitmapMeasurer()
	private defaultSource = new DefaultFontSource()
	private localSource = new LocalFontSource()

	// One-time init for `fontId`. Subsequent calls are no-ops. Must be
	// awaited before `charWidth` / `textWidth` for that font.
	async load(fontId: string = DEFAULT_FONT_ID): Promise<void> {
		if (this.loaded.has(fontId)) return
		const widths = new Map<string, number>()
		if (fontId === DEFAULT_FONT_ID) {
			await this.loadDefault(widths)
		} else {
			await this.loadCustom(fontId, widths)
		}
		this.widths.set(fontId, widths)
		this.loaded.add(fontId)
	}

	private async loadDefault(widths: Map<string, number>): Promise<void> {
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
		await applyProviders(json, widths, bitmapLoader, referenceLoader, this.measurer)
	}

	private async loadCustom(fontId: string, widths: Map<string, number>): Promise<void> {
		const referenceLoader = async (id: string): Promise<Buffer | null> =>
			this.localSource.readJsonIfExists(id)
		const bitmapLoader = async (file: string): Promise<Buffer> => this.localSource.readBitmap(file)
		const json = this.localSource.readJson(fontId)
		await applyProviders(json, widths, bitmapLoader, referenceLoader, this.measurer)
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
}