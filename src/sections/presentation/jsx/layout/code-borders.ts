// Decorate a `<code>` block's source with a thin-text border box
// (`┌─…─┐` top with language name, `└─…─┘` bottom, `│ … │` rows).
//
// The layout is built once into a structured `BorderedRows` (top border,
// per-row segments, bottom border) so callers can either:
//   - serialize the full set of rows as one bordered block (`wrap()`)
//   - serialize a slice of code rows + the shared border as a single
//     viewport-sized chunk (`serializeWindow()` — used by scrolling
//     `<code>` blocks, where each chunk is rendered as a separate
//     text_display entity and the scroll-tick toggles which chunk
//     is visible).

import { charWidth, wrapCodeLinesAsArray, wrapCodeLinesAsTuples } from '../text-metrics'
import type { StyledSegment } from '../render'

export type Precomputed = {
	codeLines: string[]
	/** Source line (0-indexed) per visual row in `codeLines`. */
	sourceLineOfVisualRow: number[]
	highlighted: StyledSegment[] | null
}

/**
 * Structured row-by-row representation of a bordered code block.
 * Each code row carries its own segment list so callers can serialize
 * a slice (`serializeWindow`) without re-running the wrap math.
 */
export type BorderedRows = {
	topBorder: StyledSegment[]
	/** One entry per visual code row (after wrap). */
	codeRows: StyledSegment[][]
	bottomBorder: StyledSegment[]
	/** PadEnd target — every code row is filled to this length. */
	longestInnerChars: number
	/** Width between the two `│`s (gutter + code). */
	outerWidth: number
	/** Number of leading-space chars inside the `│`s (gutter prefix). */
	gutterChars: number
}

export type WrapArgs = {
	content: string
	language: string
	fontId: string
	lineWidthPx: number
	bold: boolean
	borderColor: `#${string}` | undefined
	langColor: `#${string}` | undefined
	codeColor: `#${string}` | undefined
	precomputed: Precomputed | undefined
	lineNumbers: boolean
	lineCount?: number
	gutterColor: `#${string}` | undefined
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
		const rows = this.buildRows({
			content,
			language,
			fontId,
			lineWidthPx,
			bold,
			borderColor,
			langColor,
			codeColor,
			precomputed,
			lineNumbers,
			lineCount,
			gutterColor,
		})
		return this.serializeWindow(rows, 0, rows.codeRows.length)
	}

	// Run the full wrap math but capture row-by-row segments instead of
	// flattening. Used both by `wrap()` (full window) and `serializeWindow`
	// (chunked scroll case).
	buildRows(args: WrapArgs): BorderedRows {
		const {
			content,
			language,
			fontId,
			lineWidthPx,
			bold,
			borderColor,
			langColor,
			codeColor,
			precomputed,
			lineNumbers,
			lineCount,
			gutterColor,
		} = args
		const gutterChars = lineNumbers ? Math.max(2, String(lineCount ?? 0).length) : 0
		const DEFAULT_CHAR_PX = 6
		// `line_width` (MC NBT) caps total row chars between the two `│`s
		// at `lineWidthPx / DEFAULT_CHAR_PX`. Row overhead =
		// `gutterChars + 5` chars (leading ' ', gutter prefix, ' │ ')
		// between the bars; plus the 2 `│`s themselves.
		const maxRowChars = Math.max(10, Math.floor(lineWidthPx / DEFAULT_CHAR_PX) - 2)
		const maxCodeChars = Math.max(10, maxRowChars - gutterChars - 5)
		// Wrap cap: tighter than the padEnd target so the row fits
		// comfortably even when narrow chars let the wrap go slightly
		// over the bitmap-px budget.
		const wrapCodeChars = Math.max(10, maxCodeChars - 8)
		const codeCharW = charWidth('│', false, fontId)
		const innerWidth = Math.max(50, wrapCodeChars * codeCharW)
		const codeLines =
			precomputed?.codeLines ??
			wrapCodeLinesAsArray(content, innerWidth, bold, fontId)
		const sourceLineOfVisualRow: number[] | null =
			precomputed?.sourceLineOfVisualRow ??
			(lineNumbers
				? wrapCodeLinesAsTuples(content, innerWidth, bold, fontId).map((t) => t.sourceLine)
				: null)
		const highlighted = precomputed?.highlighted ?? null
		const longestInnerChars = maxCodeChars

		const langPart = language ? `${language}─` : ''
		const gutterInner = gutterChars ? gutterChars + 5 : 2
		const outerWidth = longestInnerChars + gutterInner
		const dashCount = Math.max(0, outerWidth - langPart.length)

		const fmtLineNum = (n: number) => {
			const s = String(n)
			return s.padStart(gutterChars, ' ')
		}

		// Top: ┌ + dashes + lang tag + ┐.
		const topBorder: StyledSegment[] = []
		topBorder.push({ text: `┌${'─'.repeat(dashCount)}`, color: borderColor })
		if (language) {
			topBorder.push({ text: language, color: langColor })
			topBorder.push({ text: '─', color: borderColor })
		}
		topBorder.push({ text: '┐', color: borderColor })

		// Bottom: └ + dashes + ┘. Identical across chunks so it's
		// shared.
		const bottomBorder: StyledSegment[] = [
			{ text: `└${'─'.repeat(outerWidth)}┘`, color: borderColor },
		]

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

		// Build each code row's segment list. The first row omits its
		// leading '\n' — it's joined after `topBorder` during serialize.
		// Each subsequent row begins with '\n'.
		const codeRows: StyledSegment[][] = []

		const buildRow = (i: number, leadingNewline: boolean): StyledSegment[] => {
			const row: StyledSegment[] = []
			if (leadingNewline) row.push({ text: '\n', color: borderColor })
			row.push({ text: '│ ', color: borderColor })
			if (lineNumbers) {
				const isContinuation =
					i > 0 &&
					sourceLineOfVisualRow !== null &&
					sourceLineOfVisualRow[i] === sourceLineOfVisualRow[i - 1]
				if (isContinuation) {
					row.push({ text: ' '.repeat(gutterChars), color: gutterColor })
					row.push({ text: ' │ ', color: borderColor })
				} else {
					const sourceLineNum =
						sourceLineOfVisualRow !== null ? sourceLineOfVisualRow[i] + 1 : i + 1
					row.push({ text: fmtLineNum(sourceLineNum), color: gutterColor })
					row.push({ text: ' │ ', color: borderColor })
				}
			}
			return row
		}

		if (segs && segStarts) {
			let lineStart = 0
			for (let i = 0; i < codeLines.length; i++) {
				const lineLen = codeLines[i].length
				const lineEnd = lineStart + lineLen
				const row = buildRow(i, true)

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
						this.push(row, slice, seg.color)
						written += slice.length
					}
					if (segEnd >= lineEnd) break
					s++
				}
				if (written < lineLen) {
					this.push(row, codeLines[i].slice(written), codeColor)
					written = lineLen
				}
				if (written < longestInnerChars) {
					this.push(row, ' '.repeat(longestInnerChars - written), codeColor)
				}
				row.push({ text: ' │', color: borderColor })

				codeRows.push(row)
				lineStart = lineEnd + 1 // +1 for the \n separator between lines
			}
		} else {
			for (let i = 0; i < codeLines.length; i++) {
				const row = buildRow(i, true)
				row.push({ text: codeLines[i].padEnd(longestInnerChars, ' '), color: codeColor })
				row.push({ text: ' │', color: borderColor })
				codeRows.push(row)
			}
		}

		// NOTE: every code row keeps its leading '\n'. The top border has
		// no trailing '\n' but ends right where the first code row begins,
		// so the first code row's '\n' cleanly forces text_display to draw
		// the top border as its own visual row before the first code row.

		return {
			topBorder,
			codeRows,
			bottomBorder,
			longestInnerChars,
			outerWidth,
			gutterChars,
		}
	}

	/**
	 * Serialize a slice of code rows into a flat `StyledSegment[]` for one
	 * chunk. The chunk starts with `topBorder`, includes `codeRows[start..start+count)`,
	 * and ends with `bottomBorder`. Each chunk therefore has its own top +
	 * bottom border (chunks overlap at the same XZ but only one is visible
	 * per tick, so the duplicate border is invisible).
	 */
	serializeWindow(rows: BorderedRows, start: number, count: number): StyledSegment[] {
		const out: StyledSegment[] = []
		for (const seg of rows.topBorder) out.push({ ...seg })
		const end = Math.min(start + count, rows.codeRows.length)
		for (let i = start; i < end; i++) {
			// Every code row keeps its leading '\n'. The first row's '\n'
			// pushes text_display onto a fresh visual row after topBorder;
			// subsequent rows use theirs as a plain row-break.
			for (const seg of rows.codeRows[i]) out.push({ ...seg })
		}
		// Bottom border preceded by '\n'.
		if (rows.bottomBorder.length > 0) {
			out.push({ text: '\n', color: rows.bottomBorder[0].color })
			for (const seg of rows.bottomBorder) out.push({ ...seg })
		}
		return out
	}
}