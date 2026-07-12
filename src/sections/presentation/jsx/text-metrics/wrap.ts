// Text wrapping math. Given a font's per-char widths, splits text into
// visual lines that fit within `lineWidth` pixels.

import type { FontLoader } from './font-loader'
import { DEFAULT_FONT_ID } from './font-loader'

export class TextWrap {
	constructor(private loader: FontLoader) {}

	// Word-wrap `text` to one or more visual lines. Long words char-wrap.
	// Preserves leading whitespace on each source line's first continuation.
	wrapToLines(
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

			const spaceW = this.loader.charWidth(' ', bold, fontId)
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
				const wordWidth = this.loader.textWidth(word, bold, fontId)

				// Word wider than the line — char-wrap across multiple lines.
				if (wordWidth > lineWidth) {
					flush()
					let chunk = ''
					let chunkWidth = 0
					for (const ch of word) {
						const cw = this.loader.charWidth(ch, bold, fontId)
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

			// Restore leading whitespace on the first continuation line.
			if (lines[0] !== undefined) lines[0] = leading + lines[0]
			out.push(...lines)
		}

		return out.length > 0 ? out : ['']
	}

	// Number of visual lines `text` occupies when word-wrapped.
	wrapLines(text: string, lineWidth: number, bold: boolean, fontId: string = DEFAULT_FONT_ID): number {
		if (lineWidth <= 0) return 1
		return Math.max(1, this.wrapToLines(text, lineWidth, bold, fontId).length)
	}

	// Wrap multi-line code: preserves `\n` breaks, char-wraps any source
	// line wider than `lineWidth` itself, counts one visual line per
	// blank source line.
	wrapCodeLines(
		text: string,
		lineWidth: number,
		bold: boolean,
		fontId: string = DEFAULT_FONT_ID,
	): number {
		const sources = text.split('\n')
		let total = 0
		for (const line of sources) {
			total += line.length === 0 ? 1 : this.wrapLines(line, lineWidth, bold, fontId)
		}
		return Math.max(1, total)
	}

	// Array-returning twin of `wrapCodeLines`. Preserves `\n` breaks;
	// each source line is wrapped independently. Blank source lines
	// yield one empty string each.
	wrapCodeLinesAsArray(
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
				out.push(...this.wrapToLines(line, lineWidth, bold, fontId))
			}
		}
		return out
	}

	/**
	 * Like `wrapCodeLinesAsArray` but each returned entry also carries
	 * the index of the source line it came from. Needed by code-borders
	 * so wrapped continuations share their source line's number — without
	 * this, a long line split across two visual rows would get numbered
	 * 1 and 2 instead of both being numbered 1.
	 */
	wrapCodeLinesAsTuples(
		text: string,
		lineWidth: number,
		bold: boolean,
		fontId: string = DEFAULT_FONT_ID,
	): { line: string; sourceLine: number }[] {
		const sources = text.split('\n')
		const out: { line: string; sourceLine: number }[] = []
		sources.forEach((line, sourceLine) => {
			if (line.length === 0) {
				out.push({ line: '', sourceLine })
			} else {
				for (const wrapped of this.wrapToLines(line, lineWidth, bold, fontId)) {
					out.push({ line: wrapped, sourceLine })
				}
			}
		})
		return out
	}
}