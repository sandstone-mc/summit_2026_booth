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

import type { FontLoader } from './font-loader'
import { DEFAULT_FONT_ID } from './font-loader'

export class TextWrap {
	constructor(private loader: FontLoader) {}

	// Greedy word-fill fudge factors, tuned against the user's
	// `JSX_DEBUG_WRAP=1` verdicts (see `.temp/wrap-scripts/check.ts`).
	// `BitmapMeasurer` only counts fully opaque pixels, so anti-aliased
	// glyph edges add a small residual advance that the measured
	// `width` under-reports. Bumping per-char width by `CHAR_FUDGE`
	// captures that. The `BUDGET_FUDGE` widens the wrap budget to
	// match MC's actual split points — `line_width` is rounded from a
	// real-number LESS width and a small tolerance compensates for
	// the rounding. The brute force settled on these multipliers;
	// see `.temp/wrap-scripts/check.ts` for the tuning script.
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
	 * Simulate Minecraft's text_display line wrapping using the ACTUAL NBT
	 * `line_width` as the budget.
	 *
	 * `line_width` NBT is in **bitmap pixels**, not display pixels — MC's
	 * word-wrap compares the running cumulative bitmap-pixel width of the
	 * current line against `line_width`, regardless of the entity's
	 * transformation scale. The visible size of each glyph scales with
	 * `textScale`, but the wrap budget does NOT scale with it. That's
	 * also why the layout pipeline passes `width.px × widthCompensation`
	 * (= effective bitmap budget after shrinking for larger scales) to
	 * `wrapLines` — the compensation keeps visual line widths similar
	 * across scales; both the layout AND MC end up using bitmap px.
	 *
	 * Bold advances each char by 1 bitmap px (FontLoader already folds
	 * this into `charWidth(ch, true)`). Char-wrap only fires when a
	 * single word's bitmap width exceeds `line_width` outright —
	 * otherwise MC word-wraps at the nearest space, even when that
	 * pushes the line slightly past the budget.
	 */
	simulateMcWrap(
		text: string,
		lineWidthNbt: number,
		textScale: number,
		bold: boolean,
		fontId: string = DEFAULT_FONT_ID,
	): number {
		if (lineWidthNbt <= 0) return 1
		// Bitmap-pixel char width — same units as `lineWidthNbt`. Entity
		// `textScale` does NOT scale the wrap budget (MC compares bitmap
		// widths directly against the NBT `line_width`).
		void textScale
		const cw = (ch: string): number => this.loader.charWidth(ch, bold, fontId)
		const spaceW = cw(' ')

		let lines = 1
		let curW = 0
		let isFirstWord = true

		for (const sourceLine of text.split('\n')) {
			if (sourceLine === '') {
				lines++
				curW = 0
				isFirstWord = true
				continue
			}
			const words = sourceLine.split(/\s+/).filter(Boolean)
			for (const word of words) {
				let ww = 0
				for (const ch of word) ww += cw(ch)

				const spaceNeeded = isFirstWord ? 0 : spaceW
				if (curW + spaceNeeded + ww > lineWidthNbt) {
					// MC is reluctant to char-wrap — only split when the
					// word is more than 1.5× the budget past line_width.
					// Within 1.5× it just clips past the right edge.
					if (isFirstWord && ww > lineWidthNbt * 1.5) {
						// Char-wrap an oversized single word.
						lines += Math.ceil(ww / lineWidthNbt) - 1
					} else {
						lines++
						curW = ww
						isFirstWord = false
						continue
					}
				}
				curW = (isFirstWord ? 0 : curW + spaceW) + ww
				isFirstWord = false
			}
		}
		return Math.max(1, lines)
	}

	/**
	 * Same wrap math as `simulateMcWrap` but returns the actual line
	 * strings (preserving the source's `\n` line breaks as line splits).
	 * Greedy word-wrap with single-word char-wrap fallback. Useful for
	 * build-time `JSX_DEBUG_WRAP` logging to show exactly where MC
	 * will break the text.
	 */
	simulateMcWrapToLines(
		text: string,
		lineWidthNbt: number,
		textScale: number,
		bold: boolean,
		fontId: string = DEFAULT_FONT_ID,
	): string[] {
		if (lineWidthNbt <= 0) return text ? [text] : ['']
		void textScale
		const cw = (ch: string): number => this.loader.charWidth(ch, bold, fontId)
		const spaceW = cw(' ')

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
				let ww = 0
				for (const ch of word) ww += cw(ch)

				// Char-wrap an oversized single word.
				if (ww > lineWidthNbt) {
					flush()
					let chunk = ''
					let chunkWidth = 0
					for (const ch of word) {
						const cwch = cw(ch)
						if (chunkWidth + cwch > lineWidthNbt && chunk) {
							lines.push(chunk)
							chunk = ch
							chunkWidth = cwch
						} else {
							chunk += ch
							chunkWidth += cwch
						}
					}
					if (chunk) {
						currentLine = [chunk]
						currentWidth = chunkWidth
					}
					continue
				}

				const spaceNeeded = currentLine.length === 0 ? 0 : spaceW
				if (currentLine.length === 0) {
					currentLine = [word]
					currentWidth = ww
				} else if (currentWidth + spaceW + ww <= lineWidthNbt) {
					currentLine.push(word)
					currentWidth += spaceW + ww
				} else {
					flush()
					currentLine = [word]
					currentWidth = ww
				}
			}
			flush()
			if (lines.length === 0) lines.push('')

			if (lines[0] !== undefined) lines[0] = leading + lines[0]
			out.push(...lines)
		}
		return out.length > 0 ? out : ['']
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
