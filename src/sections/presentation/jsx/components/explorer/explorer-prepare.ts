// Explorer prep — async pre-compute for `<explorer>` blocks.
// Walks the filesystem rooted at each `<explorer root="...">`,
// builds one visual row per file/folder with box-drawing prefix,
// truncates long names, wraps continuations. Result feeds the layout
// pass via `ctx.result`.

import { existsSync, readdirSync } from 'fs'
import path from 'path'
import { wrapCodeLinesWithOffsets, type CodeLineWrap } from '../../text-metrics'
import { parseLength, pxToTextScale } from '../../length'
import type { StyledSegment, VNode } from '../../render'
import type { NodeWithPath } from '../../tree/walk'
import type { Styles } from '../../style'
import { DEFAULT_MONO_CHAR_PX, type Precomputed } from '../code/code-borders'
import type { RowFlexWidth } from '../../layout/row-flex'
import { parseSidePadding } from '../summon-helpers'

// Per-component constants — same role as the original
// `layout/constants.ts` exports but kept next to the only file
// that uses them.
const DEFAULT_CODE_BORDER_COLOR = '#6a6a6a' as const
const DEFAULT_EXPLORER_FOLDER_COLOR = '#4ec9b0' as const
const DEFAULT_EXPLORER_FILE_COLOR = '#d4d4d4' as const
const EXPLORER_DEFAULT_SCALE_PX = 8

const SKIPPED_FILES = new Set(['.exists', '.gitkeep', '.DS_Store'])

const PROJECT_ROOT = process.cwd()

const ELLIPSIS = '…' as const
const MIN_HEAD = 4
const MIN_TAIL = 2
const EXT_KEEP_CHARS = 3

const PREFIX_COLOR = DEFAULT_CODE_BORDER_COLOR as `#${string}`

type RowEntry = {
	display: string
	isFolder: boolean
	segments?: StyledSegment[]
	ancestorsMore: boolean[]
	isLast: boolean
	noDash?: boolean
}

type TruncationOpts = {
	budget: number
	noDash?: boolean
	colors: {
		prefix: `#${string}`
		folder: `#${string}`
		file: `#${string}`
	}
}

export async function prepareExplorerComponents(
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
				console.warn(`[explorer] root "${rootRel}" does not exist (resolved to ${absRoot}); rendering empty box`)
				continue
			}
			const declarations = styles.forPath(nodePath)
			const fontSize = parseLength(declarations['font-size'] ?? '', sceneH)
			const scalePx = fontSize?.px ?? EXPLORER_DEFAULT_SCALE_PX
			const textScale = pxToTextScale(scalePx)
			const BASELINE_TEXT_SCALE = pxToTextScale(10)
			const widthCompensation = BASELINE_TEXT_SCALE / textScale
			const sidePadding = parseSidePadding(node.props?.['side-padding'])
			const noDash = node.props?.['no-dash'] === true
			const widthRaw =
				(typeof node.props?.width === 'string' && node.props.width) ||
				declarations.width ||
				''
			let width = parseLength(widthRaw, sceneW)
			const fitContent = width === undefined || width.unit === 'fit-content'
			if (fitContent) {
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
// connectors.
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
		return
	}
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

function makeColumn(hasMore: boolean, colW: number): string {
	return hasMore ? '│'.padEnd(colW) : ''
}

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
	const rowBudget = opts.budget - prefix.length
	const segs: StyledSegment[] = []
	if (prefix) segs.push({ text: prefix, color: opts.colors.prefix })
	const nameColor = (isFolder ? opts.colors.folder : opts.colors.file) as `#${string}`
	if (isFolder) {
		const nameBudget = Math.max(0, rowBudget - 1)
		segs.push(...truncateMiddle(name, nameBudget, nameColor, opts.colors.prefix))
		if (rowBudget >= 1) {
			segs.push({ text: '/', color: opts.colors.prefix })
		}
	} else {
		const dotIdx = name.lastIndexOf('.')
		if (dotIdx <= 0 || dotIdx === name.length - 1) {
			segs.push(...truncateMiddle(name, rowBudget, nameColor, opts.colors.prefix))
		} else {
			const base = name.slice(0, dotIdx)
			const ext = name.slice(dotIdx + 1)
			const extFullCost = 1 + ext.length
			const minExtCost = ext.length > EXT_KEEP_CHARS ? 1 + EXT_KEEP_CHARS + 1 : extFullCost
			if (base.length + extFullCost <= rowBudget) {
				segs.push({ text: name, color: nameColor })
			} else if (base.length + minExtCost <= rowBudget) {
				segs.push({ text: base, color: nameColor })
				const remaining = rowBudget - base.length - 1
				if (remaining >= ext.length) {
					segs.push({ text: '.' + ext, color: nameColor })
				} else if (remaining >= 2) {
					const keepChars = remaining - 1
					segs.push({ text: '.' + ext.slice(0, keepChars), color: nameColor })
					segs.push({ text: ELLIPSIS, color: opts.colors.prefix })
				} else if (remaining >= 1) {
					segs.push({ text: '.' + ext.slice(0, 1), color: nameColor })
				} else {
					segs.push({ text: '.', color: nameColor })
				}
			} else {
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

function truncateMiddle(
	s: string,
	budget: number,
	mainColor: `#${string}`,
	grayColor: `#${string}`,
): StyledSegment[] {
	if (s.length <= budget) return [{ text: s, color: mainColor }]
	if (budget <= 0) return []
	if (budget < MIN_HEAD) {
		return [{ text: s.slice(0, budget), color: mainColor }]
	}
	if (budget < MIN_HEAD + 1 + MIN_TAIL) {
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

function wrapExplorerRows(rows: RowEntry[], maxRowChars: number): RowEntry[] {
	const out: RowEntry[] = []
	for (const row of rows) {
		if (!row.segments || row.segments.length === 0) {
			out.push(row)
			continue
		}
		const prefixSeg = row.segments[0]!
		if (prefixSeg.color !== PREFIX_COLOR) {
			out.push(row)
			continue
		}
		const prefix = prefixSeg.text
		const contentSegs = row.segments.slice(1)
		const contentChars = segmentsToChars(contentSegs)
		const prefixLen = prefix.length
		const firstRowBudget = maxRowChars - prefixLen
		if (contentChars.length <= firstRowBudget) {
			out.push(row)
			continue
		}
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
		const last = out[out.length - 1]
		if (last && last.segments && last.segments.length === 2 && last.segments[1].text === ELLIPSIS) {
			out.pop()
		}
	}
	return out
}

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

function deriveLeadingLens(rows: RowEntry[]): number[] {
	const out: number[] = []
	for (const _ of rows) out.push(0)
	return out
}