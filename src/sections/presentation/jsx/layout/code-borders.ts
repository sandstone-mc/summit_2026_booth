// Decorate a `<code>` block's source with a thin-text border box
// (`┌─…─┐` top with language name, `└─…─┘` bottom, `│ … │` rows).
// Returns a StyledSegment[] so each piece — corners, dashes, lang tag,
// code — carries its own color.

import { charWidth, wrapCodeLinesAsArray } from '../text-metrics'
import type { StyledSegment } from '../render'

export type Precomputed = { codeLines: string[]; highlighted: StyledSegment[] | null }

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
	): StyledSegment[] {
		// Use the precomputed wrap output when available — running the
		// wrap twice (here + in pre-compute) could drift.
		const codeLines =
			precomputed?.codeLines ??
			wrapCodeLinesAsArray(content, Math.max(50, lineWidthPx - 2 * charWidth('│', false, fontId)), bold, fontId)
		const highlighted = precomputed?.highlighted ?? null
		const longestInnerChars = codeLines.reduce((m, l) => Math.max(m, l.length), 0)

		const langPart = language ? `${language}─` : ''
		// Side rows carry leading + trailing space of breathing room;
		// outer width +2 so dashes + lang tag still align.
		const outerWidth = longestInnerChars + 2
		const dashCount = Math.max(0, outerWidth - langPart.length)

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

		// Middle rows: │ + code + │ (one segment per side, one for code).
		if (segs && segStarts) {
			let lineStart = 0
			for (let i = 0; i < codeLines.length; i++) {
				const lineLen = codeLines[i].length
				const lineEnd = lineStart + lineLen
				out.push({ text: '\n', color: borderColor })
				out.push({ text: '│ ', color: borderColor })
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
				out.push({ text: codeLines[i].padEnd(longestInnerChars, ' '), color: codeColor })
				out.push({ text: ' │', color: borderColor })
			}
		}

		// Bottom: └ + dashes + ┘.
		out.push({ text: '\n', color: borderColor })
		out.push({ text: `└${'─'.repeat(outerWidth)}┘`, color: borderColor })

		return out
	}
}