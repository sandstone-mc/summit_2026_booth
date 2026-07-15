// Text wrapping math. Two regimes:
//
//   - `wrapToLines` — word-wrap for prose (`<p>`, `<h1>`, `<h2>`).
//     Greedy word-fill using per-char pixel widths from `FontLoader`.
//     MUST match Minecraft's text_display `line_width` behavior, since
//     the same value is handed to MC and a mismatch makes the entity
//     render with more/fewer lines than the layout reserved space for.
//     A single word wider than `lineWidth` is char-wrapped as a fallback.
//     Leading whitespace on each source line is preserved on the first
//     visual line so wrapped continuations line up with the source.
//
//   - `wrapCodeLinesAsArray` / `wrapCodeLinesAsTuples` — MONOSPACE wrap
//     for `<code>` blocks. Every character (including spaces) is treated
//     as the same width; the budget is a pure char count, not pixels.
//     If a glyph is wider or narrower than expected that's a font bug
//     for the caller to fix, not something the wrap compensates for.
//
//   - `wrapCodeLinesWithOffsets` — same monospace wrap as above, but
//     each returned row carries the source-line-relative `[bodyStart,
//     bodyEnd)` range of the body chars it contains. Lets the caller
//     tokenize the *raw* source first and slice the resulting segments
//     into visual rows without ever splitting a token at the wrap
//     boundary.

import type { FontLoader } from './font-loader'
import { DEFAULT_FONT_ID } from './font-loader'

/**
 * One visual row produced by `wrapCodeLinesWithOffsets`. `visualLine` is
 * the full text of the row including leading whitespace and (if a wrap
 * continuation) the artificial leading space the wrap inserts. The
 * `bodyStart`/`bodyEnd` range is source-line-relative and points at the
 * body's chars in `sourceLine` — i.e. the chars that came from the
 * source after the leading whitespace run was stripped. `isContinuation`
 * is true when the wrap inserted that artificial leading space (it's
 * not part of the source).
 */
export type CodeLineWrap = {
	visualLine: string
	sourceLine: number
	leadingLen: number
	isContinuation: boolean
	bodyStart: number
	bodyEnd: number
}

export class TextWrap {
	constructor(private loader: FontLoader) {}

	// Greedy word-fill fudge factors. `BitmapMeasurer` only counts fully
	// opaque pixels, so anti-aliased glyph edges add a small residual
	// advance that the measured `width` under-reports. Bumping per-char
	// width by `CHAR_FUDGE` captures that. `BUDGET_FUDGE` widens the
	// wrap budget to match MC's actual split points — `line_width` is
	// rounded from a real-number LESS width and a small tolerance
	// compensates for the rounding.
	private static readonly CHAR_FUDGE = 1.1
	private static readonly BUDGET_FUDGE = 1.25

	// Proportional greedy word-fill. Used by prose. Mirrors Minecraft's
	// text_display `line_width` wrap so the line count we compute here
	// matches the entity's actual render. A single word wider than
	// `lineWidth` is char-wrapped across multiple lines.
	wrapToLines(
		text: string,
		lineWidth: number,
		bold: boolean,
		fontId: string = DEFAULT_FONT_ID,
	): string[] {
		if (lineWidth <= 0) return text ? [text] : ['']

		// Per-char width with the anti-aliasing fudge applied (round to
		// ≥1 px so single pixel chars don't collapse to zero).
		const cw = (ch: string): number =>
			Math.max(1, Math.round(this.loader.charWidth(ch, bold, fontId) * TextWrap.CHAR_FUDGE))
		const spaceW = cw(' ')
		// Tighten the wrap budget slightly so chars that barely exceed
		// the line wrap rather than crowd the edge. (Brute-force
		// optimum: ~25% extra tolerance rounds boundaries the same
		// way MC does.)
		const adjustedLineWidth = lineWidth * TextWrap.BUDGET_FUDGE

		const out: string[] = []
		for (const sourceLine of text.split('\n')) {
			const m = sourceLine.match(/^([ \t]*)([\s\S]*)$/)
			const leading = m ? m[1] : ''
			const body = m ? m[2] : sourceLine

			const words = body.split(/\s+/).filter(Boolean)
			if (words.length === 0) {
				out.push(leading)
				continue
			}

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
				let wordWidth = 0
				for (const ch of word) wordWidth += cw(ch)

				// Word wider than the line — char-wrap across multiple lines.
				if (wordWidth > adjustedLineWidth) {
					flush()
					let chunk = ''
					let chunkWidth = 0
					for (const ch of word) {
						const cwc = cw(ch)
						if (chunkWidth + cwc > adjustedLineWidth && chunk) {
							lines.push(chunk)
							chunk = ch
							chunkWidth = cwc
						} else {
							chunk += ch
							chunkWidth += cwc
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
				} else if (currentWidth + spaceW + wordWidth <= adjustedLineWidth) {
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

			// Restore leading whitespace on the first visual line so it
			// lines up with the source's indent (wrap continuations start
			// without indent — matches MC's behavior).
			if (lines[0] !== undefined) lines[0] = leading + lines[0]
			out.push(...lines)
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

	/**
	 * Per-visual-row data for `<code>` monospace wrap. `visualLine` is the
	 * full text of the row (leading whitespace + optional continuation
	 * indent + body). `bodyStart`/`bodyEnd` are source-line-relative
	 * offsets into the row's body chars (i.e. the chars that came from
	 * `sourceLine` after the leading run was stripped). `isContinuation`
	 * is true for wrap continuations — those rows have an artificial
	 * leading space the wrap inserts that is NOT part of the source.
	 */
	wrapCodeLinesWithOffsets(text: string, maxChars: number): CodeLineWrap[] {
		const sources = text.split('\n')
		if (maxChars <= 0) {
			return sources.map((sourceLine, sourceLineIdx) => {
				const m = sourceLine.match(/^[ \t]*/)
				const leadingLen = m ? m[0].length : 0
				return {
					visualLine: sourceLine,
					sourceLine: sourceLineIdx,
					leadingLen,
					isContinuation: false,
					bodyStart: leadingLen,
					bodyEnd: sourceLine.length,
				}
			})
		}
		const out: CodeLineWrap[] = []
		sources.forEach((sourceLine, sourceLineIdx) => {
			const m = sourceLine.match(/^([ \t]*)([\s\S]*)$/)
			const leading = m ? m[1] : ''
			const body = m ? m[2] : sourceLine
			const leadingLen = leading.length
			if (body.length === 0) {
				out.push({
					visualLine: leading,
					sourceLine: sourceLineIdx,
					leadingLen,
					isContinuation: false,
					bodyStart: leadingLen,
					bodyEnd: leadingLen,
				})
				return
			}
			// Mirror `wrapLineMonospace` so the produced `visualLine`
			// strings are byte-identical to `wrapCodeLinesAsArray`'s.
			// The added tracking is `rowBodyStart` (source-line offset of
			// the first body char in the in-flight `current` row) and
			// `isContinuation` (false on the first row of a source line,
			// true on every wrap continuation).
			let current = leading
			let breakThreshold = leadingLen
			let rowBodyStart = leadingLen
			let isContinuation = false
			for (let p = 0; p < body.length; p++) {
				const ch = body[p]
				if (current.length + 1 > maxChars && current.length > breakThreshold) {
					// Break BEFORE consuming `ch`. The row being pushed
					// holds body chars `[rowBodyStart, leadingLen + p)`
					// in source-line coords; the next row starts with
					// body[p] at `leadingLen + p`.
					out.push({
						visualLine: current,
						sourceLine: sourceLineIdx,
						leadingLen,
						isContinuation,
						bodyStart: rowBodyStart,
						bodyEnd: leadingLen + p,
					})
					current = leading + ' ' + ch
					rowBodyStart = leadingLen + p
					isContinuation = true
					breakThreshold = leadingLen + 1
				} else {
					current += ch
				}
			}
			out.push({
				visualLine: current,
				sourceLine: sourceLineIdx,
				leadingLen,
				isContinuation,
				bodyStart: rowBodyStart,
				bodyEnd: leadingLen + body.length,
			})
		})
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
