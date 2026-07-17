// Pre-compute `<explorer>` block content BEFORE the synchronous layout
// pass. Each VNode gets a `Precomputed` entry with:
//   - the raw source string (one visual row per `\n`)
//   - per-source-line `StyledSegment[]` carrying each row's colors
//     (box-drawing prefix gray, folder aqua, file off-white, ellipsis
//     gray, continuation ancestor columns gray) — `buildRows` slices
//     these into visual rows using `codeLineWraps`, same as the
//     syntax-highlight path
//   - `wrapCodeLinesWithOffsets` results, so the layout pass matches
//     exactly what we tokenize here
//
// When `<explorer width="X">` is explicit (NOT `fit-content`), each
// tree entry is middle-ellipsis truncated to fit the row budget AND
// then pre-wrapped so continuation rows line up under the original
// entry's column. Wrapping is done here (not by MC's text_display
// line_width) because MC's wrap would left-align continuation rows
// inside the bordered box instead of under the file/folder name —
// which is what makes deep trees look misaligned. Each continuation
// row carries the ancestor column prefix (`│ ` or `  ` for each
// ancestor) so vertical bars continue down the wrap.
//
// Folders treat `name + '/'` as one string and reserve 1 char from
// the row budget for the trailing `/` (gray, structural marker like
// the box-drawing prefix). Files split at the last dot and truncate
// the extension separately as `.abc…` (5 chars); the file NAME part
// gets the bulk of the budget per the "prioritize name over ext"
// rule.
//
// Mirrors `prepareCodeHighlights` shape so the layout pass treats
// explorer the same way it treats `<code>` with no grammar loaded:
// the segments are the source of color, not the tokenizer.

import { existsSync, readdirSync } from 'fs'
import path from 'path'
import { parseLength, pxToTextScale } from '../length'
import { wrapCodeLinesWithOffsets, type CodeLineWrap } from '../text-metrics'
import type { StyledSegment, VNode } from '../render'
import type { NodeWithPath } from '../tree/walk'
import type { Styles } from '../style'
import { defaultFontPx, DEFAULT_CODE_BORDER_COLOR, DEFAULT_EXPLORER_FOLDER_COLOR, DEFAULT_EXPLORER_FILE_COLOR } from '../layout/constants'
import { DEFAULT_MONO_CHAR_PX, type Precomputed } from '../layout/code-borders'
import type { RowFlexWidth } from './row-flex'

// Marker files inside a datapack dir that mean "this folder exists" but
// don't carry content. They're noise in a tree view, so we drop them.
const SKIPPED_FILES = new Set(['.exists', '.gitkeep', '.DS_Store'])

// Parse the `side-padding` JSX prop. Accepts a `[left, right]` tuple
// or a single number (applied to both sides). Returns the default
// `[1, 1]` when the prop is missing or malformed. Must match
// `element.ts`'s parser so the explorer prepass agrees with the
// layout pass on the per-row content budget.
function parseSidePadding(raw: unknown): [number, number] {
	if (Array.isArray(raw) && raw.length >= 2) {
		const l = Number(raw[0])
		const r = Number(raw[1])
		if (Number.isFinite(l) && Number.isFinite(r)) return [l, r]
	}
	if (typeof raw === 'number' && Number.isFinite(raw)) return [raw, raw]
	return [1, 1]
}

// `<explorer root="...">` paths are project-relative (the same convention
// the user types in a `.gitignore`). Resolve them against `process.cwd()`
// — matches `prepareImgResources` so a single cwd governs both passes.
const PROJECT_ROOT = process.cwd()

// Middle-ellipsis truncation minima. A truncated row always shows at
// least `MIN_HEAD` chars of head + the ellipsis + `MIN_TAIL` chars of
// tail (= 7 chars total). Extra budget goes to the head.
const ELLIPSIS = '…' as const
const MIN_HEAD = 4
const MIN_TAIL = 2
// For files with a long extension: keep the dot + first 3 ext chars,
// then ellipsis. Short extensions (≤ 3 chars) are kept whole.
const EXT_KEEP_CHARS = 3

const PREFIX_COLOR = DEFAULT_CODE_BORDER_COLOR as `#${string}`

type RowEntry = {
	display: string
	isFolder: boolean
	/** Per-row segments when truncation produced them; otherwise undefined. */
	segments?: StyledSegment[]
	/**
	 * Ancestor-more stack at this row's depth. Used by `wrapExplorerRows`
	 * to build the continuation prefix (just the ancestor columns, no
	 * connector). For depth 0, the array is empty.
	 */
	ancestorsMore: boolean[]
	/**
	 * Whether this row is the last sibling at its depth. The walker
	 * sets this; `wrapExplorerRows` uses it to decide the current
	 * depth's continuation column (`  ` for last, `│ ` for non-last).
	 */
	isLast: boolean
	/**
	 * Tree was rendered with `no-dash`. Connector and ancestor
	 * columns are 1 char wide (`├` / `│` / ` `) instead of the default
	 * 2 chars (`├─` / `│ ` / `  `), and the wrap continuation drops
	 * the extra indent. Carried on the row so `wrapExplorerRows`
	 * doesn't need the truncation opts at wrap time.
	 */
	noDash?: boolean
}

type TruncationOpts = {
	/** Per-row char budget excluding prefix (the prefix varies per row). */
	budget: number
	/** Render connectors as just `├` / `└` (no `─`). */
	noDash?: boolean
	colors: {
		prefix: `#${string}`
		folder: `#${string}`
		file: `#${string}`
	}
}

export async function prepareExplorerTrees(
	visiblePerSlide: NodeWithPath[][],
	styles: Styles,
	sceneW: number,
	sceneH: number,
	rowFlexWidths: WeakMap<VNode, RowFlexWidth> = new WeakMap(),
): Promise<WeakMap<VNode, Precomputed>> {
	const map: WeakMap<VNode, Precomputed> = new WeakMap()

	type Entry = {
		node: VNode
		rows: RowEntry[]
		codeLineWraps: CodeLineWrap[]
	}
	const entries: Entry[] = []
	for (const visible of visiblePerSlide) {
		for (const { node, path: nodePath } of visible) {
			if (node.type !== 'explorer') continue
			const rootRel = String(node.props?.root ?? '').trim()
			if (!rootRel) continue
			const absRoot = path.resolve(PROJECT_ROOT, rootRel)
			if (!existsSync(absRoot)) {
				// Missing root: render an empty box instead of failing the
				// whole build. Slides referencing placeholder datapacks
				// (e.g. a TODO dir) shouldn't take the showcase down with
				// them — the user can fix the path later and the box will
				// start showing content.
				console.warn(`[explorer] root "${rootRel}" does not exist (resolved to ${absRoot}); rendering empty box`)
				continue
			}
			const declarations = styles.forPath(nodePath)
			const fontSize = parseLength(declarations['font-size'] ?? '', sceneH)
			const scalePx = fontSize?.px ?? defaultFontPx('code')
			const textScale = pxToTextScale(scalePx)
			const BASELINE_TEXT_SCALE = pxToTextScale(10)
			const widthCompensation = BASELINE_TEXT_SCALE / textScale
			// Mirrors `side-padding` / `no-dash` reading in `element.ts`.
			// `sidePadding` widens the per-row content budget by removing
			// the 1-char padding inside each `│` border; `noDash` flows
			// down to `makeTreePrefix` via `opts` so the connector renders
			// as just `├` / `└`.
			const sidePadding = parseSidePadding(node.props?.['side-padding'])
			const noDash = node.props?.['no-dash'] === true
			// JSX `width` prop wins over LESS — matches `<img>` /
			// `<code>`'s resolution order.
			const widthRaw =
				(typeof node.props?.width === 'string' && node.props.width) ||
				declarations.width ||
				''
			let width = parseLength(widthRaw, sceneW)
			// `fit-content`: resolve to the natural width (longest row +
			// border overhead). Same math the `width === undefined`
			// fallback uses — fit-content is "shrink to the minimum that
			// doesn't wrap", which IS the natural width for a tree.
			//
			// The pixel value goes through the `widthCompensation` round-
			// trip (px ↔ default-scale-px) so the wrap math downstream
			// multiplies by `widthCompensation` and lands back at the
			// right budget. Earlier code computed `longestChars * 6 + 4`
			// as a hand-rolled alternative, which truncated to the wrong
			// char count after `Math.floor( / 6) - 2` and made the longest
			// line wrap several chars early. Use the helper directly —
			// it already encodes the +2 bar / +2 internal-overhead math.
			const fitContent = width === undefined || width.unit === 'fit-content'
			if (fitContent) {
				// Pass an opts with a huge budget so the walker applies
				// `noDash` and `buildRow` produces proper segments (gray `/`
				// for folders, etc.) — same as the explicit-width path, just
				// without truncation since the box auto-sizes to fit.
				const fitOpts: TruncationOpts = {
					budget: Number.POSITIVE_INFINITY,
					noDash,
					colors: {
						prefix: DEFAULT_CODE_BORDER_COLOR as `#${string}`,
						folder: DEFAULT_EXPLORER_FOLDER_COLOR,
						file: DEFAULT_EXPLORER_FILE_COLOR,
					},
				}
				const rows = collectTreeRows(absRoot, fitOpts)
				if (rows.length === 0) continue
				const source = rows.map((r) => r.display).join('\n')
				// Compute natural width: longest source line + the bordered
				// row's `sidePadding` + 2 chars for the `│` borders. The
				// previous `computeMinCodeLineWidthPx(source, 0)` helper
				// hardcoded the 1-char padding assumption and ignored
				// `side-padding`, so a `[0, 0]` box rendered too wide.
				const longestSourceLineLen = source
					.split('\n')
					.reduce((max, line) => Math.max(max, line.length), 0)
				const naturalWidthChars =
					longestSourceLineLen + sidePadding[0] + sidePadding[1] + 2
				const minLineWidthPx = naturalWidthChars * DEFAULT_MONO_CHAR_PX
				const pxInDefault = minLineWidthPx / widthCompensation
				width = {
					value: pxInDefault,
					unit: 'px',
					px: pxInDefault,
					meters: pxInDefault / 16,
				}
				// Row-flex override: when this `<explorer>` is inside a
				// `grid-auto-flow: row` block and asked for `width: 100%`,
				// `prepareRowFlexWidths` recorded the row-distributed value.
				const flexOverride = rowFlexWidths.get(node)
				if (flexOverride) {
					width = {
						value: flexOverride.widthPx,
						unit: 'px',
						px: flexOverride.widthPx,
						meters: flexOverride.widthMeters,
					}
				}
				const wrapWidthPx = (width?.px ?? Number.POSITIVE_INFINITY) * widthCompensation
				const maxRowChars = Math.max(10, Math.floor(wrapWidthPx / DEFAULT_MONO_CHAR_PX) - 2)
				const internalOverhead = sidePadding[0] + sidePadding[1]
				const maxCodeChars = Math.max(10, maxRowChars - internalOverhead)
				const wrapCodeChars = Math.max(10, maxCodeChars)
				const codeLineWraps = wrapCodeLinesWithOffsets(source, wrapCodeChars)
				entries.push({ node, rows, codeLineWraps })
				continue
			}
			// Explicit width: compute the budget first, then collect rows
			// with truncation. `wrapExplorerRows` then pre-wraps any rows
			// that overflow the per-row char budget so continuation lines
			// align under the original entry's column.
			// Row-flex override applies here too — the user's `width:
			// 100%` inside a row-flex container is still an explicit
			// width, just one sized by the layout engine.
			const flexOverride = rowFlexWidths.get(node)
			if (flexOverride) {
				width = {
					value: flexOverride.widthPx,
					unit: 'px',
					px: flexOverride.widthPx,
					meters: flexOverride.widthMeters,
				}
			}
			const wrapWidthPx = (width?.px ?? Number.POSITIVE_INFINITY) * widthCompensation
			// Same formula as `prepareCodeHighlights` for `<code>` with no
			// gutter. Internal overhead is `paddingL + paddingR` — the
			// chars of space inside the `│` borders, configured by the
			// `side-padding` prop (default `[1, 1]`).
			const maxRowChars = Math.max(10, Math.floor(wrapWidthPx / DEFAULT_MONO_CHAR_PX) - 2)
			const internalOverhead = sidePadding[0] + sidePadding[1]
			const maxCodeChars = Math.max(10, maxRowChars - internalOverhead)
			const opts: TruncationOpts = {
				budget: maxCodeChars,
				noDash,
				colors: {
					prefix: DEFAULT_CODE_BORDER_COLOR as `#${string}`,
					folder: DEFAULT_EXPLORER_FOLDER_COLOR,
					file: DEFAULT_EXPLORER_FILE_COLOR,
				},
			}
			const rows = collectTreeRows(absRoot, opts)
			if (rows.length === 0) continue
			// Pre-wrap so continuation rows line up under the original
			// entry's column instead of at the left edge of the box.
			const wrappedRows = wrapExplorerRows(rows, maxCodeChars)
			const source = wrappedRows.map((r) => r.display).join('\n')
			const wrapCodeChars = Math.max(10, maxCodeChars)
			const codeLineWraps = wrapCodeLinesWithOffsets(source, wrapCodeChars)
			entries.push({ node, rows: wrappedRows, codeLineWraps })
		}
	}

	for (const entry of entries) {
		const segmentsPerLine = buildSegmentsPerSourceLine(entry.rows)
		map.set(entry.node, {
			codeLines: entry.codeLineWraps.map((w) => w.visualLine),
			sourceLineOfVisualRow: entry.codeLineWraps.map((w) => w.sourceLine),
			codeLineWraps: entry.codeLineWraps,
			highlightedPerSourceLine: segmentsPerLine,
			leadingLenPerSourceLine: deriveLeadingLens(entry.rows),
			source: entry.rows.map((r) => r.display).join('\n'),
		})
	}
	return map
}

// Walk `absRoot` recursively, returning one display row per visible file
// / folder in pre-order. Each row is prefixed with box-drawing
// connectors:
//   - every ancestor column is exactly 2 chars wide: `│ ` if the
//     ancestor still has more siblings, `  ` if it was the last (no
//     bar). Uniform width so every depth step is consistent — the
//     reader tells depth by how far the connector sits from the left
//     edge, not by which characters appear in the column.
//   - the connector for the current entry itself is `├─` if it has
//     more siblings, `└─` if it's last (single dash, no trailing
//     space — sits flush against the name)
//
// With `opts`, each row whose name doesn't fit the row budget is
// middle-ellipsis truncated and the per-row `segments` field is
// filled in with the styled output. Rows that already fit use the
// simple `{ display, isFolder, ancestorsMore }` shape (segments
// derived later from the display string).
function collectTreeRows(absRoot: string, opts?: TruncationOpts): RowEntry[] {
	const out: RowEntry[] = []
	walk(absRoot, 0, [], opts, out)
	return out
}

function walk(
	dirAbs: string,
	depth: number,
	ancestorsMore: boolean[],
	opts: TruncationOpts | undefined,
	out: RowEntry[],
): void {
	let entries: { name: string; isFolder: boolean }[]
	try {
		entries = readdirSync(dirAbs, { withFileTypes: true })
			.filter((e) => !SKIPPED_FILES.has(e.name))
			.map((e) => ({ name: e.name, isFolder: e.isDirectory() }))
	} catch {
		// Unreadable dir — drop silently rather than failing the whole
		// explorer. Users who care can surface the path manually.
		return
	}
	// Folders first, then files; alphabetical within each group. Stable
	// ordering across builds.
	entries.sort((a, b) => {
		if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
		return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
	})
	for (let i = 0; i < entries.length; i++) {
		const e = entries[i]
		const isLast = i === entries.length - 1
		const prefix = makeTreePrefix(ancestorsMore, isLast, opts?.noDash)
		const row = buildRow(prefix, e.name, e.isFolder, ancestorsMore, isLast, opts)
		out.push(row)
		if (e.isFolder) walk(path.join(dirAbs, e.name), depth + 1, [...ancestorsMore, !isLast], opts, out)
	}
}

// One column of the tree (ancestor or current depth). With `noDash`,
// the column is 1 char wide (`│` or ` `) — the space between vertical
// bars is dropped for tighter horizontal layout. Default width is 2
// chars (`│ ` or `  `). When the column has no bar (the entry's path
// has no more siblings at that ancestor depth), it contributes 0
// chars — the column visually "ends" at the last sibling, so deeper
// entries don't carry a trailing 2-char gap before their connector.
function makeColumn(hasMore: boolean, colW: number): string {
	return hasMore ? '│'.padEnd(colW) : ''
}

// Build the box-drawing prefix for a row given its ancestor stack and
// whether it's the last sibling at its depth. Depth 0 (the root's
// direct children) gets no prefix. `noDash` strips the trailing `─`
// from the connector AND narrows each ancestor column from 2 chars to
// 1, so the whole tree gets 1 fewer char per depth.
function makeTreePrefix(
	ancestorsMore: boolean[],
	isLast: boolean,
	noDash: boolean = false,
): string {
	const colW = noDash ? 1 : 2
	let prefix = ''
	for (const more of ancestorsMore) prefix += makeColumn(more, colW)
	prefix += isLast ? (noDash ? '└' : '└─') : noDash ? '├' : '├─'
	return prefix
}

// Build the continuation prefix for the wrap pass. Ancestor columns
// use the same width as row 1's prefix; the current depth's column is
// `│ ` (continuing) or `  ` (last), with an extra space of indent so
// wrapped content doesn't visually touch the vertical bars. With
// `noDash`, every column is 1 char wide and the extra indent is
// dropped — net result is one char shorter per depth, which keeps
// row 1 and continuation visually aligned.
function makeContinuationPrefix(
	ancestorsMore: boolean[],
	isLast: boolean,
	noDash: boolean = false,
): string {
	const colW = noDash ? 1 : 2
	let prefix = ''
	for (const more of ancestorsMore) prefix += makeColumn(more, colW)
	prefix += makeColumn(!isLast, colW)
	if (!noDash) prefix += ' '
	return prefix
}

// Build a single row's display + (when truncating) segments. When no
// truncation opts are passed, returns a plain row with `display` only
// and the segment builder derives colors later from the display string.
function buildRow(
	prefix: string,
	name: string,
	isFolder: boolean,
	ancestorsMore: boolean[],
	isLast: boolean,
	opts: TruncationOpts | undefined,
): RowEntry {
	if (!opts) {
		const display = isFolder ? `${prefix}${name}/` : `${prefix}${name}`
		return { display, isFolder, ancestorsMore, isLast }
	}
	const noDash = opts.noDash ?? false
	// Per-row content budget = total budget minus this row's prefix
	// length. No floor — `truncateMiddle` degrades gracefully for tight
	// budgets (drops the tail, then the ellipsis, then truncates the
	// head). The wrap pass will split whatever doesn't fit onto
	// continuation rows.
	const rowBudget = opts.budget - prefix.length
	// Build the display + segments together so the source string stays
	// in sync with the styled segments.
	const segs: StyledSegment[] = []
	if (prefix) segs.push({ text: prefix, color: opts.colors.prefix })
	const nameColor = (isFolder ? opts.colors.folder : opts.colors.file) as `#${string}`
	if (isFolder) {
		// Reserve 1 char from the row budget for the trailing `/` —
		// it's a structural marker (gray, same role as the box-
		// drawing prefix) and we always include it. That forces the
		// name to truncate further than its middle-ellipsis
		// minimum if it has to (e.g. `fire_raycast/` at rowBudget 7
		// becomes `fire…/` instead of `fire_r…st`).
		const nameBudget = Math.max(0, rowBudget - 1)
		segs.push(...truncateMiddle(name, nameBudget, nameColor, opts.colors.prefix))
		if (rowBudget >= 1) {
			segs.push({ text: '/', color: opts.colors.prefix })
		}
	} else {
		const dotIdx = name.lastIndexOf('.')
		// Hidden files (e.g. `.gitignore`) and files with no extension
		// fall through to the plain name path.
		if (dotIdx <= 0 || dotIdx === name.length - 1) {
			segs.push(...truncateMiddle(name, rowBudget, nameColor, opts.colors.prefix))
		} else {
			const base = name.slice(0, dotIdx)
			const ext = name.slice(dotIdx + 1)
			const extFullCost = 1 + ext.length // "." + ext
			// Minimum recognizable extension: first 3 chars + dot +
			// ellipsis (5 chars total). Short extensions (≤ 3 chars)
			// stay whole as their own minimum.
			const minExtCost = ext.length > EXT_KEEP_CHARS ? 1 + EXT_KEEP_CHARS + 1 : extFullCost

			if (base.length + extFullCost <= rowBudget) {
				// Full filename fits — no truncation at all.
				segs.push({ text: name, color: nameColor })
			} else if (base.length + minExtCost <= rowBudget) {
				// Base fits as-is AND the minimum extension fits. Keep
				// the base whole; truncate the extension just enough to
				// fit, preserving as many chars of `ext` as possible
				// (e.g. `raycast.mcfunction` → `raycast.mcfunc…`,
				// `chain_strike.mcfunction` → `chain_strike.mcfun…`).
				segs.push({ text: base, color: nameColor })
				const remaining = rowBudget - base.length - 1 // after dot
				if (remaining >= ext.length) {
					// Shouldn't reach (covered above), but safe.
					segs.push({ text: '.' + ext, color: nameColor })
				} else if (remaining >= 2) {
					// Use ellipsis, keep as many chars as possible.
					const keepChars = remaining - 1
					segs.push({ text: '.' + ext.slice(0, keepChars), color: nameColor })
					segs.push({ text: ELLIPSIS, color: opts.colors.prefix })
				} else if (remaining >= 1) {
					// Only 1 char left after the dot — no room for ellipsis.
					segs.push({ text: '.' + ext.slice(0, 1), color: nameColor })
				} else {
					segs.push({ text: '.', color: nameColor })
				}
			} else {
				// Base + min ext doesn't fit. Middle-ellipsis the base
				// (head + ellipsis + tail, min 7 chars) and pair it with
				// the minimum extension. The row will likely overflow
				// `rowBudget` and wrap to continuation rows, but the
				// minimums stay recognizable (e.g. `fire_raycast.mcfunction`
				// → `fire_ra…st.mcf…`, `return_run.mcfunction` → wraps to
				// `retu…un` + `.mcf…`).
				const baseBudget = Math.max(
					MIN_HEAD + 1 + MIN_TAIL,
					rowBudget - minExtCost,
				)
				segs.push(...truncateMiddle(base, baseBudget, nameColor, opts.colors.prefix))
				if (ext.length > EXT_KEEP_CHARS) {
					segs.push({ text: '.' + ext.slice(0, EXT_KEEP_CHARS), color: nameColor })
					segs.push({ text: ELLIPSIS, color: opts.colors.prefix })
				} else {
					segs.push({ text: '.' + ext, color: nameColor })
				}
			}
		}
	}
	const display = segs.map((s) => s.text).join('')
	return { display, isFolder, segments: segs, ancestorsMore, isLast, noDash }
}

// Middle-ellipsis truncate `s` to `budget` chars. Returns one or more
// styled segments: head + (gray) ellipsis + tail. Minimums are 4 head
// + 1 ellipsis + 2 tail (= 7 chars). Extra budget goes to the head.
// When the budget is below the minimum, falls back gracefully: drop
// the tail first (keep head + ellipsis), then drop the ellipsis.
function truncateMiddle(
	s: string,
	budget: number,
	mainColor: `#${string}`,
	grayColor: `#${string}`,
): StyledSegment[] {
	if (s.length <= budget) return [{ text: s, color: mainColor }]
	if (budget <= 0) return []
	if (budget < MIN_HEAD) {
		// Even the minimum head doesn't fit — show what we can of the head.
		return [{ text: s.slice(0, budget), color: mainColor }]
	}
	if (budget < MIN_HEAD + 1 + MIN_TAIL) {
		// Head + ellipsis fit but no room for the tail minimum.
		return [
			{ text: s.slice(0, budget - 1), color: mainColor },
			{ text: ELLIPSIS, color: grayColor },
		]
	}
	const tail = MIN_TAIL
	const head = budget - 1 - tail
	return [
		{ text: s.slice(0, head), color: mainColor },
		{ text: ELLIPSIS, color: grayColor },
		{ text: s.slice(s.length - tail), color: mainColor },
	]
}

// One (text, color) pair — the atomic unit for slicing segments
// across wrap boundaries. Spans segments cleanly (no mid-segment
// splits) when collapsing back.
type ColoredChar = { ch: string; color: `#${string}` }

function segmentsToChars(segs: StyledSegment[]): ColoredChar[] {
	const out: ColoredChar[] = []
	for (const s of segs) {
		const color = (s.color ?? '#d4d4d4') as `#${string}`
		for (const ch of s.text) out.push({ ch, color })
	}
	return out
}

function charsToSegments(chars: ColoredChar[]): StyledSegment[] {
	const out: StyledSegment[] = []
	let i = 0
	while (i < chars.length) {
		const start = i
		const color = chars[i]!.color
		while (i < chars.length && chars[i]!.color === color) i++
		out.push({ text: chars.slice(start, i).map((c) => c.ch).join(''), color })
	}
	return out
}

// Pre-wrap each tree entry that overflows `maxRowChars` so continuation
// rows line up under the original entry's column. Row 1 keeps the
// full box-drawing prefix; continuation rows prepend the ancestor
// columns only (no connector) so vertical bars continue down the
// wrap. Each output source line carries its own `StyledSegment[]`
// ready for the layout pass — the `wrapCodeLinesWithOffsets` call
// downstream sees each visual row as its own source line (no further
// wrap needed).
function wrapExplorerRows(rows: RowEntry[], maxRowChars: number): RowEntry[] {
	const out: RowEntry[] = []
	for (const row of rows) {
		if (!row.segments || row.segments.length === 0) {
			out.push(row)
			continue
		}
		const prefixSeg = row.segments[0]!
		if (prefixSeg.color !== PREFIX_COLOR) {
			// No prefix (depth 0 row); nothing to wrap against.
			out.push(row)
			continue
		}
		const prefix = prefixSeg.text
		const contentSegs = row.segments.slice(1)
		const contentChars = segmentsToChars(contentSegs)
		const prefixLen = prefix.length
		const firstRowBudget = maxRowChars - prefixLen
		if (contentChars.length <= firstRowBudget) {
			// Fits on one row — nothing to wrap.
			out.push(row)
			continue
		}
		// Need continuation rows. The continuation prefix is:
//   1. ancestor columns (`│ ` or `  ` for each ancestor) — vertical
//      bars continue down through wrap so the user can trace which
//      entry the wrapped content belongs to
//   2. the current row's own depth column — `  ` (no bar) when the
//      row is the last sibling at its depth (no entries below to
//      connect to), `│ ` otherwise
//   3. one extra space of indent so the wrapped content visually
//      detaches from the vertical bars and reads as "continued text"
//
// With `noDash`, every column is 1 char wide (`│` / ` `) and the
// extra indent is dropped — keeps row 1 and continuation visually
// aligned.
const contPrefix = makeContinuationPrefix(row.ancestorsMore, row.isLast, row.noDash)
const contRowBudget = maxRowChars - contPrefix.length
		let pos = 0
		let isFirst = true
		while (pos < contentChars.length) {
			const budget = isFirst ? firstRowBudget : contRowBudget
			const take = Math.min(Math.max(1, budget), contentChars.length - pos)
			const lineChars = contentChars.slice(pos, pos + take)
			const lineSegs = charsToSegments(lineChars)
			const linePrefix = isFirst ? prefix : contPrefix
			const fullSegs: StyledSegment[] = []
			if (linePrefix) fullSegs.push({ text: linePrefix, color: PREFIX_COLOR })
			fullSegs.push(...lineSegs)
			out.push({
				display: linePrefix + lineChars.map((c) => c.ch).join(''),
				isFolder: row.isFolder,
				segments: fullSegs,
				ancestorsMore: row.ancestorsMore,
				isLast: row.isLast,
				noDash: row.noDash,
			})
			pos += take
			isFirst = false
		}
		// If the last visual row's content (after the prefix) is
		// nothing but the ellipsis, drop the row — a `│ │ │    …`
		// row on its own carries no useful information. We check the
		// segments (not `display`) because `display` includes the
		// prefix too.
		const last = out[out.length - 1]
		if (last && last.segments && last.segments.length === 2 && last.segments[1].text === ELLIPSIS) {
			out.pop()
		}
	}
	return out
}

// Build per-source-line `StyledSegment[]` for the layout pass. When a
// row already carries pre-built segments (the truncation / wrap case),
// use them directly. Otherwise derive prefix + name from the display
// string via the box-drawing regex. Folders get the trailing `/`
// split off as a gray segment so it matches the colored-buildRow path.
function buildSegmentsPerSourceLine(rows: RowEntry[]): StyledSegment[][] {
	return rows.map((row) => {
		if (row.segments) return row.segments
		const m = row.display.match(/^([│├└─ ]+)/)
		const prefix = m ? m[1] : ''
		const rest = m ? row.display.slice(prefix.length) : row.display
		const isFolder = rest.endsWith('/')
		const out: StyledSegment[] = []
		if (prefix) out.push({ text: prefix, color: DEFAULT_CODE_BORDER_COLOR as `#${string}` })
		if (isFolder) {
			const base = rest.slice(0, -1)
			out.push({ text: base, color: DEFAULT_EXPLORER_FOLDER_COLOR as `#${string}` })
			out.push({ text: '/', color: DEFAULT_CODE_BORDER_COLOR as `#${string}` })
		} else {
			out.push({ text: rest, color: DEFAULT_EXPLORER_FILE_COLOR as `#${string}` })
		}
		return out
	})
}

// Same leading-whitespace count per source line as the wrap algorithm
// — used by the layout pass to render the indent in `codeColor` so
// `<explorer>` doesn't accidentally take its tree color from the
// `color` declaration (which folds in via segment color instead).
// For explorer rows the "indent" is the box-drawing prefix or
// continuation columns, which live in the segments (not as
// whitespace) — so leadingLen is always 0 here.
function deriveLeadingLens(rows: RowEntry[]): number[] {
	const out: number[] = []
	for (const _ of rows) out.push(0)
	return out
}