// Bitmap PNG → per-char widths. MC's `BitmapProvider` lays glyphs in
// a grid of rows × cols (cell size computed from row length + PNG dims).

import sharp from 'sharp'
import type { BitmapProvider } from './types'

// MC's advance for chars not present in any bitmap provider. Matches
// `BitmapProvider.GlyphInfo` for the default font.
export const MISSING_CHAR_WIDTH = 7

export class BitmapMeasurer {
	// Walks every row of `bitmap.chars`, finds the rightmost non-transparent
	// column in each cell, and stores `rightmost + 1 + 1` (end-exclusive
	// column + inter-char spacing). Cell widths can differ per row.
	async measure(
		bitmap: BitmapProvider,
		pngBytes: Buffer,
		out: Map<string, number>,
	): Promise<void> {
		const { data, info } = await sharp(pngBytes)
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true })

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
				out.set(chars[col], maxX < 0 ? MISSING_CHAR_WIDTH : maxX + 2)
			}
		}
	}
}