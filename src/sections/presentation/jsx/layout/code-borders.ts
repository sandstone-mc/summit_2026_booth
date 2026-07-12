// Decorate a `<code>` block's source with a thin-text border box
// (`┌─…─┐` top with language name, `└─…─┘` bottom, `│ … │` rows).
// Returns a StyledSegment[] so each piece — corners, dashes, lang tag,
// code — carries its own color.

import { charWidth, wrapCodeLinesAsArray, wrapCodeLinesAsTuples } from '../text-metrics'
import type { StyledSegment } from '../render'

export type Precomputed = {
	codeLines: string[]
	/** Source line (0-indexed) per visual row in `codeLines`. */
	sourceLineOfVisualRow: number[]
	highlighted: StyledSegment[] | null
}

export class CodeBorders {
	// Push `slice` onto `out`, merging with the previous segment when
	// colors match. Keeps the segment list short — adjacent same-color
	// runs inflate NBT for nothing.
	private push(out: StyledSegment[], slice: string, color: `#${string}` | undefined): void {
		if (!slice) return
		const last = out[out.length - 1]
		if (last && last.color === color) {
			last.text += slice
			return
		}
		const seg: StyledSegment = { text: slice }
		if (color !== undefined) seg.color = color
		out.push(seg)
	}

	// Build the bordered+highlighted code content. The precomputed map
	// is shared with the layout pass so the wrap output isn't recomputed.
	// `lineNumbers=true` prefixes each row with a right-aligned numeric
	// gutter `<n> │ ` so the box reads like a code editor. `lineCount`
	// controls the gutter width (digits) when callers want to widen it
	// explicitly; defaults to `codeLines.length`.
	wrap(
		content: string,
		language: string,
		fontId: string,
		lineWidthPx: number,
		bold: boolean,
		borderColor: `#${string}` | undefined,
		langColor: `#${string}` | undefined,
		codeColor: `#${string}` | undefined,
		precomputed: Precomputed | undefined,
		lineNumbers: boolean = false,
		lineCount?: number,
		gutterColor: `#${string}` | undefined = undefined,
	): StyledSegment[] {
		// Use the precomputed wrap output when available — running the
		// wrap twice (here + in pre-compute) could drift.
		const gutterChars = lineNumbers ? Math.max(2, String(lineCount ?? 0).length) : 0
		// Each visual line of source is one row inside the bordered box.
		// Source is already wrapped in `codeLines`; line numbers index the
		// original source lines, so use the *source* newlines to count.
		// `lineCount` overrides this when the caller pre-counts.
		const totalSourceLines =
			typeof lineCount === 'number' ? lineCount : content.split('\n').length
		// Use the precomputed wrap output when available — running the
		// wrap twice (here + in pre-compute) could drift.
		// MC's `line_width` is in default-font chars (~6 px/char) and
		// counts each rendered glyph (any font) as one char. Our row
		// sends `1 + gutterChars + 3 + longestInnerChars + 1` chars
		// between the two `│`s — cap `longestInnerChars` so the total
		// fits inside `lineWidthPx / 6 - 2`.
		const DEFAULT_CHAR_PX = 6
		// Wrap at `innerWidth = maxCodeChars * codeCharW` so each visual
		// row's char count never exceeds `maxCodeChars`. padEnd target is
		// also `maxCodeChars` so the top/bottom bar matches the widest row
		// AND the row fits `line_width` (default-font chars).
		const maxRowChars = Math.max(10, Math.floor(lineWidthPx / DEFAULT_CHAR_PX) - 2)
		// PadEnd target: `maxCodeChars`. Tighter than the wrap cap so the
		// border fills the row width without overflowing `line_width`.
		const maxCodeChars = Math.max(10, maxRowChars - gutterChars - 5)
		// Wrap cap: a bit tighter than the padEnd target so the row
		// fits comfortably even when narrow chars let the wrap go
		// slightly over the bitmap-px budget.
		const wrapCodeChars = Math.max(10, maxCodeChars - 8)
		const codeCharW = charWidth('│', false, fontId)
		const innerWidth = Math.max(50, wrapCodeChars * codeCharW)
		const codeLines =
			precomputed?.codeLines ??
			wrapCodeLinesAsArray(content, innerWidth, bold, fontId)
		// Per-visual-row source-line index, so a long source line that wraps
		// to N visual rows keeps the same line number on every row. Comes
		// from the precomputed map when available (single source of truth);
		// otherwise computed locally with the same wrap args as `codeLines`.
		const sourceLineOfVisualRow: number[] | null =
			precomputed?.sourceLineOfVisualRow ??
			(lineNumbers ? wrapCodeLinesAsTuples(content, innerWidth, bold, fontId).map((t) => t.sourceLine) : null)
		const highlighted = precomputed?.highlighted ?? null
		// Use `maxCodeChars` as the padEnd target so the border fully fills
		// `line_width`. Raw longest may be smaller (narrow chars fit more
		// in innerWidth); padEnd pads up to `maxCodeChars` to make the
		// border use the full available width.
		const longestInnerChars = maxCodeChars

		const langPart = language ? `${language}─` : ''
		// Each row's content between the two `│`s =
		//   ' ' + (gutter '<n>' + ' │ ' if lineNumbers) + code + ' '
		// Top/bottom bar dash count must match the widest row or
		// text_display wraps the right `│` onto a new line.
		const gutterInner = gutterChars ? gutterChars + 5 : 2
		const outerWidth = longestInnerChars + gutterInner
		const dashCount = Math.max(0, outerWidth - langPart.length)

		const fmtLineNum = (n: number) => {
			const s = String(n)
			return s.padStart(gutterChars, ' ')
		}

		const out: StyledSegment[] = []

		// Top: ┌ + dashes + lang tag + ┐.
		out.push({ text: `┌${'─'.repeat(dashCount)}`, color: borderColor })
		if (language) {
			out.push({ text: language, color: langColor })
			out.push({ text: '─', color: borderColor })
		}
		out.push({ text: '┐', color: borderColor })

		// Pre-compute each segment's start in `codeLines.join('\n')` —
		// both segments and codeLines ranges live in that joined coord
		// space, so position-based slicing (not cursor-walking) works.
		const segs = highlighted && highlighted.length > 0 ? highlighted : null
		const segStarts: number[] | null = segs
			? (() => {
					const starts = new Array<number>(segs.length)
					let acc = 0
					for (let s = 0; s < segs.length; s++) {
						starts[s] = acc
						acc += segs[s].text.length
					}
					return starts
				})()
			: null

		// Middle rows: │ + (gutter + │ )? + code + │ (one segment per side,
		// gutter when lineNumbers is on, one for code). Continuation rows
		// (where this visual row's source line == the previous row's) get
		// a blank gutter — same width, no number — so columns line up.
		if (segs && segStarts) {
			let lineStart = 0
			for (let i = 0; i < codeLines.length; i++) {
				const lineLen = codeLines[i].length
				const lineEnd = lineStart + lineLen
				out.push({ text: '\n', color: borderColor })
				out.push({ text: '│ ', color: borderColor })
				if (lineNumbers) {
					const isContinuation =
						lineNumbers &&
						sourceLineOfVisualRow !== null &&
						i > 0 &&
						sourceLineOfVisualRow[i] === sourceLineOfVisualRow[i - 1]
					if (isContinuation) {
						// Blank gutter: same width as a numbered row, spaces
						// in gutterColor so it visually disappears but still
						// occupies the column.
						out.push({ text: ' '.repeat(gutterChars), color: gutterColor })
						out.push({ text: ' │ ', color: borderColor })
					} else {
						const sourceLineNum =
							sourceLineOfVisualRow !== null ? sourceLineOfVisualRow[i] + 1 : i + 1
						out.push({ text: fmtLineNum(sourceLineNum), color: gutterColor })
						out.push({ text: ' │ ', color: borderColor })
					}
				}
				// Find first segment overlapping [lineStart, lineEnd).
				let s = 0
				while (s < segs.length && segStarts[s] + segs[s].text.length <= lineStart) s++

				let written = 0
				while (s < segs.length && segStarts[s] < lineEnd) {
					const seg = segs[s]
					const segStart = segStarts[s]
					const segEnd = segStart + seg.text.length
					const fromIdx = Math.max(0, lineStart - segStart)
					const toIdx = Math.min(seg.text.length, lineEnd - segStart)
					if (fromIdx < toIdx) {
						const slice = seg.text.slice(fromIdx, toIdx)
						this.push(out, slice, seg.color)
						written += slice.length
					}
					if (segEnd >= lineEnd) break
					s++
				}
				// Trailing uncaptured chars fall through to codeColor.
				if (written < lineLen) {
					this.push(out, codeLines[i].slice(written), codeColor)
					written = lineLen
				}
				if (written < longestInnerChars) {
					this.push(out, ' '.repeat(longestInnerChars - written), codeColor)
				}
				out.push({ text: ' │', color: borderColor })
				lineStart = lineEnd + 1 // +1 for the \n separator between lines
			}
		} else {
			for (let i = 0; i < codeLines.length; i++) {
				out.push({ text: '\n', color: borderColor })
				out.push({ text: '│ ', color: borderColor })
				if (lineNumbers) {
					const isContinuation =
						lineNumbers &&
						sourceLineOfVisualRow !== null &&
						i > 0 &&
						sourceLineOfVisualRow[i] === sourceLineOfVisualRow[i - 1]
					if (isContinuation) {
						out.push({ text: ' '.repeat(gutterChars), color: gutterColor })
						out.push({ text: ' │ ', color: borderColor })
					} else {
						const sourceLineNum = sourceLineOfVisualRow
							? sourceLineOfVisualRow[i] + 1
							: i + 1
						out.push({ text: fmtLineNum(sourceLineNum), color: gutterColor })
						out.push({ text: ' │ ', color: borderColor })
					}
				}
				out.push({ text: codeLines[i].padEnd(longestInnerChars, ' '), color: codeColor })
				out.push({ text: ' │', color: borderColor })
			}
		}

		// Bottom: └ + dashes + ┘.
		out.push({ text: '\n', color: borderColor })
		out.push({ text: `└${'─'.repeat(outerWidth)}┘`, color: borderColor })

		// DEBUG (build-time): report what we computed so we can see why
		// text_display is wrapping the right `│`. Filters by content
		// signature so we only see the magic code slide.
		const debugTag = content.includes('Charged, Stunned') ? '[MAGIC]' : ''
		if (debugTag) {
			console.log(
				`${debugTag} lang=${language} lineNumbers=${lineNumbers} ` +
					`lineWidthPx=${lineWidthPx.toFixed(1)} ` +
					`gutterChars=${gutterChars} ` +
					`innerWidth=${innerWidth.toFixed(1)} ` +
					`longestInnerChars=${longestInnerChars} ` +
					`outerWidth=${outerWidth} ` +
					`codeLines=${codeLines.length} ` +
					`firstLineLen=${codeLines[0]?.length ?? 0} ` +
					`lastRowGaps=${
						codeLines[codeLines.length - 1]
							? codeLines[codeLines.length - 1].length -
							  codeLines[codeLines.length - 1].trimEnd().length
							: 0
					}`,
			)
			codeLines.slice(0, 3).forEach((l, i) =>
				console.log(`  ${debugTag} row[${i}] len=${l.length} text=${JSON.stringify(l.slice(0, 30))}...`),
			)
		}

		return out
	}
}