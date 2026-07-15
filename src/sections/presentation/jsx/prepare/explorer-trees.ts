// Pre-compute `<explorer>` block content BEFORE the synchronous layout
// pass. Each VNode gets a `Precomputed` entry with:
//   - the raw source string (one indented tree row per source line)
//   - per-source-line `StyledSegment[]` carrying each row's color
//     (folder vs file) — `buildRows` slices these into visual rows
//     using `codeLineWraps`, same as the syntax-highlight path
//   - `wrapCodeLinesWithOffsets` results, so the layout pass matches
//     exactly what we tokenize here
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
import { defaultFontPx, DEFAULT_EXPLORER_FOLDER_COLOR, DEFAULT_EXPLORER_FILE_COLOR } from '../layout/constants'
import { computeMinCodeLineWidthPx, DEFAULT_MONO_CHAR_PX, type Precomputed } from '../layout/code-borders'
import type { RowFlexWidth } from './row-flex'

// Marker files inside a datapack dir that mean "this folder exists" but
// don't carry content. They're noise in a tree view, so we drop them.
const SKIPPED_FILES = new Set(['.exists', '.gitkeep', '.DS_Store'])

// `<explorer root="...">` paths are project-relative (the same convention
// the user types in a `.gitignore`). Resolve them against `process.cwd()`
// — matches `prepareImgResources` so a single cwd governs both passes.
const PROJECT_ROOT = process.cwd()

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
		source: string
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
			const rows = collectTreeRows(absRoot)
			if (rows.length === 0) continue
			// Each source line = one tree row, indented 2 spaces per depth.
			// The leading indent is part of the source line so the monospace
			// wrap preserves it on the first visual row, matching how `<code>`
			// handles indented source.
			const source = rows.map((r) => r.display).join('\n')
			const declarations = styles.forPath(nodePath)
			const fontSize = parseLength(declarations['font-size'] ?? '', sceneH)
			const scalePx = fontSize?.px ?? defaultFontPx('code')
			const textScale = pxToTextScale(scalePx)
			const BASELINE_TEXT_SCALE = pxToTextScale(10)
			const widthCompensation = BASELINE_TEXT_SCALE / textScale
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
			if (width === undefined || width.unit === 'fit-content') {
				const minLineWidthPx = computeMinCodeLineWidthPx(source, 0)
				const pxInDefault = minLineWidthPx / widthCompensation
				width = {
					value: pxInDefault,
					unit: 'px',
					px: pxInDefault,
					meters: pxInDefault / 16,
				}
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
			// Same formula as `prepareCodeHighlights` for `<code>` with no
			// gutter. Internal overhead is `2` (just the two `│`-adjacent
			// padding chars inside the border).
			const maxRowChars = Math.max(10, Math.floor(wrapWidthPx / DEFAULT_MONO_CHAR_PX) - 2)
			const internalOverhead = 2
			const maxCodeChars = Math.max(10, maxRowChars - internalOverhead)
			const wrapCodeChars = Math.max(10, maxCodeChars)
			const codeLineWraps = wrapCodeLinesWithOffsets(source, wrapCodeChars)
			entries.push({ node, source, codeLineWraps })
		}
	}

	for (const entry of entries) {
		const segmentsPerLine = buildSegmentsPerSourceLine(entry.source)
		map.set(entry.node, {
			codeLines: entry.codeLineWraps.map((w) => w.visualLine),
			sourceLineOfVisualRow: entry.codeLineWraps.map((w) => w.sourceLine),
			codeLineWraps: entry.codeLineWraps,
			highlightedPerSourceLine: segmentsPerLine,
			leadingLenPerSourceLine: deriveLeadingLens(entry.source),
			source: entry.source,
		})
	}
	return map
}

// Walk `absRoot` recursively, returning one display row per visible file
// / folder in pre-order. Depth-indented relative names with `/` suffix
// on folders.
function collectTreeRows(absRoot: string): { display: string; isFolder: boolean }[] {
	const out: { display: string; isFolder: boolean }[] = []
	walk(absRoot, 0, out)
	return out
}

function walk(dirAbs: string, depth: number, out: { display: string; isFolder: boolean }[]): void {
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
	for (const e of entries) {
		const indent = ' '.repeat(depth * 2)
		const display = e.isFolder ? `${indent}${e.name}/` : `${indent}${e.name}`
		out.push({ display, isFolder: e.isFolder })
		if (e.isFolder) walk(path.join(dirAbs, e.name), depth + 1, out)
	}
}

// Build a one-segment `StyledSegment[]` per source line — each line
// keeps its full text and carries a single color (folder or file).
// The layout pass slices these by `[bodyStart, bodyEnd)` per visual
// row, so we don't need to pre-split; one segment per line is enough.
function buildSegmentsPerSourceLine(source: string): StyledSegment[][] {
	const lines = source.split('\n')
	const out: StyledSegment[][] = []
	for (const line of lines) {
		const trimmed = line.replace(/^[ \t]+/, '')
		const isFolder = trimmed.endsWith('/')
		out.push([
			{
				text: line,
				color: (isFolder ? DEFAULT_EXPLORER_FOLDER_COLOR : DEFAULT_EXPLORER_FILE_COLOR) as `#${string}`,
			},
		])
	}
	return out
}

// Same leading-whitespace count per source line as the wrap algorithm
// — used by the layout pass to render the indent in `codeColor` so
// `<explorer>` doesn't accidentally take its tree color from the
// `color` declaration (which folds in via segment color instead).
function deriveLeadingLens(source: string): number[] {
	const out: number[] = []
	for (const line of source.split('\n')) {
		const m = line.match(/^[ \t]*/)
		out.push(m ? m[0].length : 0)
	}
	return out
}
