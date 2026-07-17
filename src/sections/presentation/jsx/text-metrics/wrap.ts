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
import type { StyledSegment } from '../render'

type SegToken = {
	ch: string
	bold: boolean
	italic: boolean
	fontId: string
	color?: `#${string}`
	background?: `#${string}`
	segIdx: number
}

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
	 * Wrap a `StyledSegment[]` (inline-formatted prose from
	 * `parseInlineFormatting`) into per-visual-line `StyledSegment[]`s.
	 * Each token carries its own font/bold/italic so char widths span
	 * font changes correctly — a mono-flavoured `` `code` `` span in a
	 * proportional paragraph is measured against the monospace font,
	 * the rest against the base font, and the budget is the sum.
	 *
	 * The greedy algorithm and fudge factors (CHAR_FUDGE / BUDGET_FUDGE)
	 * mirror `wrapToLines` so a mixed-fluent paragraph wraps at the same
	 * point MC will. Each visual line is the source segments sliced by
	 * token range, with style copied from the originating segment so a
	 * single multi-char span survives the slice unchanged.
	 */
	wrapSegmentedLines(
		segments: StyledSegment[],
		lineWidth: number,
		baseBold: boolean,
		fontId: string = DEFAULT_FONT_ID,
	): StyledSegment[][] {
		if (segments.length === 0) return [[]]
		if (lineWidth <= 0) return [segments.map((s) => ({ ...s }))]

		// Expand segments -> per-char token stream. Undefined `bold`
		// inherits the entity-level `baseBold` so an h1 without `**…**`
		// markers is still measured bold (matching MC's text-component
		// bold inheritance).
		const tokens: SegToken[] = []
		for (let si = 0; si < segments.length; si++) {
			const seg = segments[si]
			const segBold = seg.bold ?? baseBold
			const segFont = seg.font ?? fontId
			for (const ch of seg.text) {
				tokens.push({
					ch,
					bold: segBold,
					italic: seg.italic ?? false,
					fontId: segFont,
					color: seg.color,
					background: seg.background,
					segIdx: si,
				})
			}
		}
		if (tokens.length === 0) return [[]]

		const cw = (t: SegToken): number =>
			Math.max(1, Math.round(this.loader.charWidth(t.ch, t.bold, t.fontId) * TextWrap.CHAR_FUDGE))
		// Inter-word space width always measured against the BASE font.
		// The token-stream budget adds one space width per gap between
		// adjacent visual-line words; the rendering of the space itself
		// in MC inherits the surrounding text style, but the budget's
		// absolute pixel cost is dominated by the base font and stays
		// stable across inline-style changes.
		const spaceW = Math.max(1, Math.round(this.loader.charWidth(' ', false, fontId) * TextWrap.CHAR_FUDGE))
		const adjustedLineWidth = lineWidth * TextWrap.BUDGET_FUDGE

		const out: StyledSegment[][] = []

		// Iterate per source line (split on '\n' carried in the token
		// stream — `\n` inside a segment's text is preserved through
		// the parser, so a soft break in the JSX string still counts
		// as a hard wrap here).
		let lineStart = 0
		for (let i = 0; i <= tokens.length; i++) {
			if (i === tokens.length || tokens[i].ch === '\n') {
				this.wrapSegmentLine(
					tokens,
					segments,
					lineStart,
					i,
					adjustedLineWidth,
					cw,
					spaceW,
					out,
				)
				lineStart = i + 1
			}
		}

		return out.length > 0 ? out : [[]]
	}

	private wrapSegmentLine(
		tokens: SegToken[],
		segments: StyledSegment[],
		lineStart: number,
		lineEnd: number,
		adjustedLineWidth: number,
		cw: (t: SegToken) => number,
		spaceW: number,
		out: StyledSegment[][],
	): void {
		if (lineEnd === lineStart) {
			out.push([])
			return
		}

		// Leading whitespace count. Preserved verbatim on the FIRST
		// visual line of this source line — matches `wrapToLines`'s
		// `leading + lines[0]` behavior.
		let leadEnd = lineStart
		while (leadEnd < lineEnd && (tokens[leadEnd].ch === ' ' || tokens[leadEnd].ch === '\t')) {
			leadEnd++
		}

		type Range = { start: number; end: number }
		const bodyLines: Range[] = []
		let curStart = leadEnd
		let curEnd = leadEnd
		let curW = 0

		const flush = () => {
			if (curEnd > curStart) bodyLines.push({ start: curStart, end: curEnd })
			curStart = curEnd
			curW = 0
		}

		let pos = leadEnd
		while (pos < lineEnd) {
			// Greedy word — contiguous non-whitespace, non-newline tokens.
			let wordEnd = pos
			while (
				wordEnd < lineEnd &&
				tokens[wordEnd].ch !== ' ' &&
				tokens[wordEnd].ch !== '\t' &&
				tokens[wordEnd].ch !== '\n'
			) {
				wordEnd++
			}
			if (wordEnd === pos) {
				// Defensive: shouldn't happen given the loop guard, but
				// keep advancing to avoid an infinite loop on degenerate
				// input (e.g. a bare whitespace char stranded in a
				// segment).
				pos++
				continue
			}
			let w = 0
			for (let k = pos; k < wordEnd; k++) w += cw(tokens[k])

			// Char-wrap when a single word is wider than the budget.
			// Mirrors wrapToLines's chunk-by-chunk fallback.
			if (w > adjustedLineWidth) {
				flush()
				let chunkStart = pos
				let chunkW = 0
				for (let k = pos; k < wordEnd; k++) {
					const tcw = cw(tokens[k])
					if (chunkW + tcw > adjustedLineWidth && k > chunkStart) {
						bodyLines.push({ start: chunkStart, end: k })
						chunkStart = k
						chunkW = tcw
					} else {
						chunkW += tcw
					}
				}
				if (chunkStart < wordEnd) bodyLines.push({ start: chunkStart, end: wordEnd })
				curStart = wordEnd
				curEnd = wordEnd
				curW = 0
				// Skip trailing spaces after the char-wrapped word.
				pos = wordEnd
				while (pos < lineEnd && (tokens[pos].ch === ' ' || tokens[pos].ch === '\t')) pos++
				continue
			}

			if (curEnd === curStart) {
				curStart = pos
				curEnd = wordEnd
				curW = w
			} else if (curW + spaceW + w <= adjustedLineWidth) {
				curEnd = wordEnd
				curW += spaceW + w
			} else {
				flush()
				curStart = pos
				curEnd = wordEnd
				curW = w
			}

			// Skip inter-word spaces. The next iteration resumes on the
			// next word; the implicit inter-word space is added back via
			// `spaceW` in the budget check above.
			pos = wordEnd
			while (pos < lineEnd && (tokens[pos].ch === ' ' || tokens[pos].ch === '\t')) pos++
		}
		flush()
		if (bodyLines.length === 0) bodyLines.push({ start: leadEnd, end: leadEnd })

		for (let li = 0; li < bodyLines.length; li++) {
			const line = bodyLines[li]
			const sliceStart = li === 0 ? lineStart : line.start
			out.push(sliceTokensToSegments(tokens, segments, sliceStart, line.end))
		}
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

/**
 * Slice `segments` into per-visual-line arrays at the user-supplied
 * word-break points. Each `breakWord` is a global word index (the
 * `wrap-breaks` JSX prop convention) — word N begins a new visual line.
 *
 * Used when the caller trusts their break list over the engine's
 * natural wrap (e.g. MC's actual wrap disagrees with our greedy
 * word-fill, or the user wants a specific 2-line layout regardless
 * of width). Splits across segments are safe because we walk the
 * per-char token stream with whitespace-aware word tracking.
 */
export function sliceSegmentsByWordBreaks(
	segments: StyledSegment[],
	breakWords: number[],
): StyledSegment[][] {
	if (segments.length === 0) return [[]]

	// Build token stream the same way `wrapSegmentedLines` does, but
	// without bold/font inheritance — we only need char + segIdx.
	const tokens: { ch: string; segIdx: number }[] = []
	for (let si = 0; si < segments.length; si++) {
		for (const ch of segments[si].text) tokens.push({ ch, segIdx: si })
	}
	if (tokens.length === 0) return [[]]

	// Walk the token stream, accumulating words. A word starts on a
	// non-whitespace token that follows a whitespace-or-beginning state.
	const sortedBreaks = [...breakWords].sort((a, b) => a - b)
	let wordIdx = 0
	let breakCursor = 0
	type Range = { start: number; end: number }
	const ranges: Range[] = []
	let curStart = 0
	let curEnd = 0
	let inWord = false
	for (let i = 0; i < tokens.length; i++) {
		const ch = tokens[i].ch
		const isWs = ch === ' ' || ch === '\t'
		if (isWs) {
			if (inWord) {
				wordIdx++
				inWord = false
				// After incrementing, check if the NEXT word should
				// start a new visual line.
				if (
					breakCursor < sortedBreaks.length &&
					wordIdx === sortedBreaks[breakCursor]
				) {
					ranges.push({ start: curStart, end: curEnd })
					curStart = curEnd
					breakCursor++
				}
			}
		} else {
			if (!inWord) {
				inWord = true
			}
			curEnd = i + 1
		}
	}
	if (inWord) wordIdx++
	if (curEnd > curStart) ranges.push({ start: curStart, end: curEnd })

	// Edge case: empty ranges (e.g. the text starts with whitespace,
	// no words encountered) — emit at least one empty visual line so
	// the layout doesn't drop the element entirely.
	if (ranges.length === 0) return [[]]

	const out: StyledSegment[][] = []
	for (const range of ranges) {
		out.push(sliceTokensToSegments(tokens, segments, range.start, range.end))
	}
	return out
}

// Walk `tokens[start..end)`, grouping consecutive tokens that share a
// `segIdx`, and emit one `StyledSegment` per group. Style fields
// (color/font/bold/italic/background) are copied verbatim from the
// source segment, so a sliced span retains the user's explicit flags
// while undefined fields fall back to entity-level / baseBold at NBT
// emission time.
function sliceTokensToSegments(
	tokens: { ch: string; segIdx: number }[],
	segments: StyledSegment[],
	start: number,
	end: number,
): StyledSegment[] {
	const out: StyledSegment[] = []
	let i = start
	while (i < end) {
		const segIdx = tokens[i].segIdx
		const sourceSeg = segments[segIdx]
		let text = ''
		while (i < end && tokens[i].segIdx === segIdx) {
			text += tokens[i].ch
			i++
		}
		if (!text) continue
		const seg: StyledSegment = { text }
		if (sourceSeg.color !== undefined) seg.color = sourceSeg.color
		if (sourceSeg.background !== undefined) seg.background = sourceSeg.background
		if (sourceSeg.font !== undefined) seg.font = sourceSeg.font
		if (sourceSeg.bold !== undefined) seg.bold = sourceSeg.bold
		if (sourceSeg.italic !== undefined) seg.italic = sourceSeg.italic
		out.push(seg)
	}
	return out
}
