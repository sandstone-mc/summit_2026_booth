// Bitmap PNG → per-char widths + vertical extent. MC's `BitmapProvider`
// lays glyphs in a grid of rows × cols (cell size computed from row length
// + PNG dims).

import sharp from 'sharp'
import type { BitmapProvider } from './types'

// MC's advance for chars not present in any bitmap provider. Matches
// `BitmapProvider.GlyphInfo` for the default font.
export const MISSING_CHAR_WIDTH = 7

// Per-glyph metrics extracted from a single bitmap cell. `minY` / `maxY`
// are pixel offsets from the cell top; `minY = 0` means the glyph touches
// the top edge, `maxY = cellH - 1` means it touches the bottom. A fully-
// transparent glyph is emitted with `minY = cellH`, `maxY = -1` as a
// sentinel — FontLoader skips these when aggregating font-level metrics.
export type GlyphMetrics = {
	width: number
	minY: number
	maxY: number
}

// Sentinel value for `GlyphMetrics.minY` when a glyph cell is fully
// transparent. Use this when reading the map to detect empty cells.
export const EMPTY_GLYPH_MIN_Y = Number.POSITIVE_INFINITY

// What `measure()` returns. `cellHeight` is the MEASURED cell height in
// pixels (`PNG height / chars.length`); `glyphs` holds one entry per
// char in the bitmap. FontLoader uses `cellHeight` as the source of
// truth for cell size — the JSON `height` field is unreliable (it's
// only set when the cell is non-default, and Mojang's defaults vary).
export type BitmapMeasurement = {
	cellHeight: number
	glyphs: Map<string, GlyphMetrics>
}

export class BitmapMeasurer {
	// Walks every row of `bitmap.chars` and returns per-char metrics
	// (width + topmost / bottommost non-transparent pixel row) plus the
	// measured cell height. Cell widths can differ per row; cell height
	// is uniform across rows.
	async measure(
		bitmap: BitmapProvider,
		pngBytes: Buffer,
	): Promise<BitmapMeasurement> {
		const { data, info } = await sharp(pngBytes)
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true })

		const rowCount = bitmap.chars.length
		const cellH = info.height / rowCount
		const glyphs = new Map<string, GlyphMetrics>()
		for (let row = 0; row < rowCount; row++) {
			const chars = bitmap.chars[row]
			const cellW = info.width / chars.length
			const startY = row * cellH
			for (let col = 0; col < chars.length; col++) {
				const startX = col * cellW
				let maxX = -1
				let minY = cellH
				let maxY = -1
				for (let y = 0; y < cellH; y++) {
					for (let x = 0; x < cellW; x++) {
						const i = ((startY + y) * info.width + (startX + x)) * 4
						if (data[i + 3] > 0) {
							if (x > maxX) maxX = x
							if (y < minY) minY = y
							if (y > maxY) maxY = y
						}
					}
				}
				glyphs.set(chars[col], {
					width: maxX < 0 ? MISSING_CHAR_WIDTH : maxX + 2,
					minY: maxX < 0 ? EMPTY_GLYPH_MIN_Y : minY,
					maxY: maxX < 0 ? -1 : maxY,
				})
			}
		}
		return { cellHeight: cellH, glyphs }
	}
}