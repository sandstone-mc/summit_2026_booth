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

import { wrapCodeLinesWithOffsets, type CodeLineWrap } from '../text-metrics'
import type { StyledSegment } from '../render'

// Monospace char width used both for the wrap budget (chars per row)
// and the back-translation to MC's `line_width` (pixels per row). Every
// glyph in the monospace font is treated as this width — caller's job
// to fix the font if a glyph is wider/narrower than this assumption.
export const DEFAULT_MONO_CHAR_PX = 6

/**
 * Minimum `line_width` (in default-scale pixels) needed to render a
 * `<code>` block without wrapping any of its source lines. Used when
 * the caller didn't set `width` — the box then shrinks to fit content
 * rather than padding out to infinity.
 *
 * Mirrors the budget math in `buildRows`: longest source line +
 * internal overhead (`gutterChars + 5` with line-numbers, `2`
 * without) + 2 chars for the two `│` bars.
 */
export function computeMinCodeLineWidthPx(content: string, gutterChars: number): number {
	const longestSourceLineLen = content
		.split('\n')
		.reduce((max, line) => Math.max(max, line.length), 0)
	// Internal overhead mirrors `buildRows` — see comment there for
	// why the no-gutter case uses `2` instead of `5`.
	const internalOverhead = gutterChars ? gutterChars + 5 : 2
	const maxRowChars = longestSourceLineLen + internalOverhead
	return (maxRowChars + 2) * DEFAULT_MONO_CHAR_PX
}

export type Precomputed = {
	/** Visual rows (derived from `codeLineWraps[i].visualLine`). Kept for
	 *  callers that iterate `codeLines.length` without caring about offsets. */
	codeLines: string[]
	/** Source line (0-indexed) per visual row in `codeLines`. */
	sourceLineOfVisualRow: number[]
	/** Per-visual-row offset data — the slice of the source line each row
	 *  covers, plus whether the row is a wrap continuation. */
	codeLineWraps: CodeLineWrap[]
	/** Segments per source line, in source-line coords. `null` per index
	 *  when no grammar is loaded / the parser produced no segments for
	 *  the whole `<code>` block. Lets the layout pass slice segments into
	 *  visual rows without ever splitting a token at a wrap boundary. */
	highlightedPerSourceLine: Array<StyledSegment[] | null>
	/** Leading whitespace length per source line — emitted in `codeColor`
	 *  on every visual row of that source line. */
	leadingLenPerSourceLine: number[]
	/** Raw pre-wrap source string (one source line per `\n`). Used by the
	 *  layout pass to recompose `content` for `<explorer>` and any other
	 *  element whose text doesn't come from JSX children. Optional so
	 *  older call sites that build Precomputed from just `codeLines`
	 *  keep type-checking. */
	source?: string
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
	/**
	 * `[left, right]` chars of space inside the `│` borders on every
	 * line. Default `[1, 1]` — that's the 1-char breathing room on
	 * each side of the content. Use `[0, 0]` for flush content,
	 * `[2, 0]` for extra left indent, etc.
	 */
	sidePadding?: [number, number]
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

	// Render one visual row's inner content (leading whitespace + wrap
	// continuation indent + body chars with their token colors) onto
	// `row`. `wrap` carries the source-line-relative `[bodyStart,
	// bodyEnd)` range for the body chars; `segs` is that source line's
	// segments in source-line coords (positions implicit in segment
	// order). Returns the number of inner chars emitted so the caller
	// can pad the row up to `longestInnerChars`.
	private renderRowSegments(
		row: StyledSegment[],
		wrap: CodeLineWrap,
		segs: StyledSegment[] | null,
		codeColor: `#${string}` | undefined,
		leadingLen: number,
		longestInnerChars: number,
	): number {
		let written = 0
		// Leading whitespace from the source — always `codeColor`. Same
		// chars on every row of the source line (the wrap preserves them
		// verbatim).
		if (leadingLen > 0) {
			this.push(row, ' '.repeat(leadingLen), codeColor)
			written += leadingLen
		}
		// The wrap inserts an artificial leading space on continuation
		// rows to visually distinguish them from the source's own indent.
		// That space is NOT in the source, so we emit it in `codeColor`
		// outside the segment walk.
		if (wrap.isContinuation) {
			this.push(row, ' ', codeColor)
			written += 1
		}
		const bodyStart = wrap.bodyStart
		const bodyEnd = wrap.bodyEnd
		// Walk source-line segments clipped to [bodyStart, bodyEnd).
		// Segments are in source-line order and contiguous; cursor
		// tracks the source-line offset of the next segment's start.
		if (segs && bodyEnd > bodyStart) {
			let cursor = 0
			let sIdx = 0
			// Skip segments that end before bodyStart.
			while (sIdx < segs.length && cursor + segs[sIdx].text.length <= bodyStart) {
				cursor += segs[sIdx].text.length
				sIdx++
			}
			while (sIdx < segs.length && cursor < bodyEnd) {
				const seg = segs[sIdx]
				const segEnd = cursor + seg.text.length
				const fromIdx = Math.max(0, bodyStart - cursor)
				const toIdx = Math.min(seg.text.length, bodyEnd - cursor)
				if (fromIdx < toIdx) {
					const slice = seg.text.slice(fromIdx, toIdx)
					this.push(row, slice, seg.color)
					written += slice.length
				}
				if (segEnd >= bodyEnd) break
				cursor = segEnd
				sIdx++
			}
		}
		return written
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
		sidePadding?: [number, number],
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
			sidePadding,
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
			sidePadding,
		} = args
		const gutterChars = lineNumbers ? Math.max(2, String(lineCount ?? 0).length) : 0
		const DEFAULT_CHAR_PX = DEFAULT_MONO_CHAR_PX
		// `[left, right]` chars of space inside the `│` borders on every
		// line. Default `[1, 1]`. `0, 0` makes content touch the borders
		// directly. `[2, 0]` adds an extra left indent, etc.
		const paddingLeft = sidePadding?.[0] ?? 1
		const paddingRight = sidePadding?.[1] ?? 1
		// `line_width` (MC NBT) caps total row chars between the two `│`s
		// at `lineWidthPx / DEFAULT_CHAR_PX`. Internal overhead matches
		// the bordered-row construction:
		//   - With gutter: `paddingL + gutterChars + 3 + paddingR`
		//     (left pad + gutter content + ' │ ' separator + right pad).
		//   - Without gutter: `paddingL + paddingR` (just the two side
		//     pads; no separator).
		// Plus the 2 `│` characters themselves.
		const maxRowChars = Math.max(10, Math.floor(lineWidthPx / DEFAULT_CHAR_PX) - 2)
		const internalOverhead = gutterChars
			? paddingLeft + gutterChars + 3 + paddingRight
			: paddingLeft + paddingRight
		const maxCodeChars = Math.max(10, maxRowChars - internalOverhead)
		// Wrap budget: char count per visual row. Treat every glyph as
		// monospace — if a char ends up the wrong width that's a font
		// bug, not something the wrap compensates for. We pack right up
		// to `maxCodeChars` so no trailing slack is wasted.
		const wrapCodeChars = Math.max(10, maxCodeChars)
		// Pull wraps from the precomputed map (shared with the async pass
		// so the layout doesn't recompute). When the caller didn't run the
		// precompute (no grammar, raw `CodeBorders.wrap` call), compute
		// here. The precomputed shape mirrors the freshly-computed shape so
		// the slicing below treats them identically.
		const codeLineWraps: CodeLineWrap[] =
			precomputed?.codeLineWraps ?? wrapCodeLinesWithOffsets(content, wrapCodeChars)
		const codeLines = codeLineWraps.map((w) => w.visualLine)
		const sourceLineOfVisualRow: number[] | null = codeLineWraps.map((w) => w.sourceLine)
		const highlightedPerSourceLine: Array<StyledSegment[] | null> | null =
			precomputed?.highlightedPerSourceLine ?? null
		// `leadingLenPerSourceLine` (from the precompute pass) maps source
		// line index → its leading whitespace length. When no precompute
		// ran, derive it from the wraps (all rows of a source line share
		// the same `leadingLen`).
		const leadingLenPerSourceLine: number[] = precomputed?.leadingLenPerSourceLine ?? []
		if (leadingLenPerSourceLine.length === 0 && codeLineWraps.length > 0) {
			for (const w of codeLineWraps) {
				if (leadingLenPerSourceLine[w.sourceLine] === undefined) {
					leadingLenPerSourceLine[w.sourceLine] = w.leadingLen
				}
			}
		}
		const longestInnerChars = maxCodeChars

		const langPart = language ? `${language}─` : ''
		const gutterInner = internalOverhead
		const outerWidth = longestInnerChars + gutterInner
		const dashCount = Math.max(0, outerWidth - langPart.length)
		// Char constants for the bordered row's left/right edges. Each
		// edge is the `│` border plus `paddingL` / `paddingR` spaces.
		const leftEdge = '│' + ' '.repeat(paddingLeft)
		const rightEdge = ' '.repeat(paddingRight) + '│'

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

		// Build each code row's segment list. The first row omits its
		// leading '\n' — it's joined after `topBorder` during serialize.
		// Each subsequent row begins with '\n'.
		const codeRows: StyledSegment[][] = []

		const buildRow = (i: number, leadingNewline: boolean): StyledSegment[] => {
			const row: StyledSegment[] = []
			if (leadingNewline) row.push({ text: '\n', color: borderColor })
			row.push({ text: leftEdge, color: borderColor })
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

		// Any segments at all? An entry's `highlightedPerSourceLine[k]` is
		// `null` when no grammar ran (no parser / no `lang`); a non-null
		// entry may still be an empty array when the parser produced zero
		// captures. Either way we fall through to the single-color path.
		const hasAnySegments =
			highlightedPerSourceLine !== null &&
			highlightedPerSourceLine.some((s) => s !== null && s.length > 0)

		if (hasAnySegments && highlightedPerSourceLine) {
			for (let i = 0; i < codeLineWraps.length; i++) {
				const wrap = codeLineWraps[i]
				const segs = highlightedPerSourceLine[wrap.sourceLine] ?? null
				const row = buildRow(i, true)
				const innerWritten = this.renderRowSegments(
					row,
					wrap,
					segs,
					codeColor,
					leadingLenPerSourceLine[wrap.sourceLine] ?? wrap.leadingLen,
					longestInnerChars,
				)
				if (innerWritten < longestInnerChars) {
					this.push(row, ' '.repeat(longestInnerChars - innerWritten), codeColor)
				}
				row.push({ text: rightEdge, color: borderColor })
				codeRows.push(row)
			}
		} else {
			for (let i = 0; i < codeLines.length; i++) {
				const row = buildRow(i, true)
				row.push({ text: codeLines[i].padEnd(longestInnerChars, ' '), color: codeColor })
				row.push({ text: rightEdge, color: borderColor })
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