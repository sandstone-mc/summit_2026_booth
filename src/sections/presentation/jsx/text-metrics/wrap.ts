// Text wrapping math. Two regimes:
//
//   - `wrapToLines` — proportional wrap for prose (`<p>`, `<h1>`, `<h2>`).
//     Greedy char-fill using per-char pixel widths from `FontLoader`.
//
//   - `wrapCodeLinesAsArray` / `wrapCodeLinesAsTuples` — MONOSPACE wrap
//     for `<code>` blocks. Every character (including spaces) is treated
//     as the same width; the budget is a pure char count, not pixels.
//     If a glyph is wider or narrower than expected that's a font bug
//     for the caller to fix, not something the wrap compensates for.

import type { FontLoader } from './font-loader'
import { DEFAULT_FONT_ID } from './font-loader'

export class TextWrap {
	constructor(private loader: FontLoader) {}

	// Proportional greedy char-fill. Used by prose. Packs chars onto a
	// line until the next char's pixel width would exceed `lineWidth`,
	// then breaks and continues. Leading whitespace on each source line
	// is preserved at the start of every visual line so wrapped
	// continuations stay aligned with the source's indent.
	wrapToLines(
		text: string,
		lineWidth: number,
		bold: boolean,
		fontId: string = DEFAULT_FONT_ID,
	): string[] {
		if (lineWidth <= 0) return text ? [text] : ['']

		const out: string[] = []
		for (const sourceLine of text.split('\n')) {
			if (sourceLine.length === 0) {
				out.push('')
				continue
			}
			const m = sourceLine.match(/^([ \t]*)([\s\S]*)$/)
			const leading = m ? m[1] : ''
			const body = m ? m[2] : sourceLine
			const leadingWidth = this.loader.textWidth(leading, bold, fontId)

			let current = leading
			let currentWidth = leadingWidth
			for (const ch of body) {
				const cw = this.loader.charWidth(ch, bold, fontId)
				if (currentWidth + cw > lineWidth && current.length > leading.length) {
					out.push(current)
					current = leading + ch
					currentWidth = leadingWidth + cw
				} else {
					current += ch
					currentWidth += cw
				}
			}
			out.push(current)
		}

		return out.length > 0 ? out : ['']
	}

	// Number of visual lines `text` occupies when wrapped.
	wrapLines(text: string, lineWidth: number, bold: boolean, fontId: string = DEFAULT_FONT_ID): number {
		if (lineWidth <= 0) return 1
		return Math.max(1, this.wrapToLines(text, lineWidth, bold, fontId).length)
	}

	/**
	 * Monospace wrap for `<code>` blocks. Each character counts as 1 unit
	 * regardless of its actual glyph width. `maxChars` caps the number of
	 * characters per visual line; when a source line exceeds that, we
	 * greedily fill the line then break and continue on the next. Leading
	 * whitespace is preserved at the start of every visual line so
	 * wrapped continuations line up with the source's indent.
	 */
	wrapCodeLinesAsArrayMonospace(text: string, maxChars: number): string[] {
		if (maxChars <= 0) return [text]
		const out: string[] = []
		for (const sourceLine of text.split('\n')) {
			if (sourceLine.length === 0) {
				out.push('')
				continue
			}
			out.push(...this.wrapLineMonospace(sourceLine, maxChars))
		}
		return out.length > 0 ? out : ['']
	}

	/**
	 * Same as `wrapCodeLinesAsArrayMonospace` but each returned entry
	 * also carries the index of the source line it came from. Needed by
	 * code-borders so wrapped continuations share their source line's
	 * number — otherwise a long line split across two visual rows would
	 * get numbered 1 and 2 instead of both being numbered 1.
	 */
	wrapCodeLinesAsTuplesMonospace(
		text: string,
		maxChars: number,
	): { line: string; sourceLine: number }[] {
		if (maxChars <= 0) return [{ line: text, sourceLine: 0 }]
		const sources = text.split('\n')
		const out: { line: string; sourceLine: number }[] = []
		sources.forEach((sourceLine, sourceLineIdx) => {
			if (sourceLine.length === 0) {
				out.push({ line: '', sourceLine: sourceLineIdx })
				return
			}
			for (const wrapped of this.wrapLineMonospace(sourceLine, maxChars)) {
				out.push({ line: wrapped, sourceLine: sourceLineIdx })
			}
		})
		return out
	}

	// Worker for the monospace variants. Splits a single source line into
	// visual lines of at most `maxChars` chars each.
	private wrapLineMonospace(sourceLine: string, maxChars: number): string[] {
		// Preserve the source's leading whitespace on the FIRST visual
		// row; every subsequent row (a wrap continuation) gets +1 extra
		// space of indent so the wrap is visually distinguishable from
		// the original source indent.
		const m = sourceLine.match(/^([ \t]*)([\s\S]*)$/)
		const leading = m ? m[1] : ''
		const body = m ? m[2] : sourceLine
		if (body.length === 0) return [leading]

		const out: string[] = []
		let current = leading
		// Break threshold tracks the current row's indent length. We can
		// only break after the row has at least one body char, otherwise
		// a single over-budget chunk still produces one line.
		let breakThreshold = leading.length
		for (const ch of body) {
			if (current.length + 1 > maxChars && current.length > breakThreshold) {
				out.push(current)
				current = leading + ' ' + ch
				breakThreshold = leading.length + 1
			} else {
				current += ch
			}
		}
		out.push(current)
		return out
	}

	// Counts the visual lines a multi-line `<code>` source produces when
	// wrapped in monospace at `maxChars` chars. Provided for callers that
	// only need the count.
	wrapCodeLinesMonospace(text: string, maxChars: number): number {
		if (maxChars <= 0) return 1
		let total = 0
		for (const line of text.split('\n')) {
			if (line.length === 0) {
				total += 1
				continue
			}
			const m = line.match(/^([ \t]*)([\s\S]*)$/)
			const leadingLen = m ? m[1].length : 0
			const bodyLen = m ? m[2].length : line.length
			if (bodyLen === 0) {
				total += 1
				continue
			}
			const budget = Math.max(1, maxChars - leadingLen)
			total += Math.max(1, Math.ceil(bodyLen / budget))
		}
		return Math.max(1, total)
	}
}
