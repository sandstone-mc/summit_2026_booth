// Build-time diagnostic: detect text elements that would render fully or
// partially off-screen and report them as warnings. Fully off-screen
// elements are flagged for exclusion (their `summon` commands would be
// wasted work, and the warning makes the cause obvious).
//
// Text in MC `text_display` extends UPWARD from the entity Y — entity Y
// is the bottom of the rendered text, and the text top sits at
// `entityY + lineHeight × visualRowCount`. So for an entity placed at
// world Y, the rendered region is `[entityY, entityY + textHeight]`.
//
// Slide bounds are `[originY, originY + sceneH]`.

import type { ElementLayout } from './layout/element'
import type { Placement } from './layout'
import { wrapLines } from './text-metrics'
import { pxToTextLineHeight } from './length'
import { DEFAULT_FONT_ID } from './text-metrics/font-loader'

// Local type alias — `TextElementLayout` is internal to `element.ts`.
type TextElementLayout = Extract<ElementLayout, { kind: 'text' }>

export type OffScreenKind = 'partial' | 'full'

export type OffScreenIssue = {
	slideIdx: number
	kind: OffScreenKind
	/** Truncated preview of the element's text content (best effort). */
	contentPreview: string
	/** Path of the offending VNode within its slide tree (for filtering). */
	nodePath: readonly string[]
	entityY: number
	textTop: number
	textBottom: number
	slideBottom: number
	slideTop: number
}

export type DiagnoseResult = {
	issues: OffScreenIssue[]
	/** Node paths of fully-off-screen elements — caller may skip these. */
	excludedNodePaths: Set<string>
}

/**
 * Scan a list of placements and flag text elements whose rendered text
 * doesn't fit inside the slide. `originY` is the world Y of the slide's
 * BOTTOM edge; `sceneH` is the slide height in blocks.
 */
export function diagnosePlacements(
	placements: readonly Placement[],
	slideIdx: number,
	originY: number,
	sceneH: number,
): DiagnoseResult {
	const slideBottom = originY
	const slideTop = originY + sceneH
	const issues: OffScreenIssue[] = []
	const excludedNodePaths = new Set<string>()

	for (const placement of placements) {
		const { renderBottom, renderTop, contentPreview } = estimateRenderBounds(placement)
		if (renderBottom === null || renderTop === null) continue
		const fullyOff = renderTop <= slideBottom || renderBottom >= slideTop
		const partialOff =
			!fullyOff && (renderBottom < slideBottom || renderTop > slideTop)
		if (!fullyOff && !partialOff) continue

		const nodePath = placement.el.path
		issues.push({
			slideIdx,
			kind: fullyOff ? 'full' : 'partial',
			contentPreview,
			nodePath,
			entityY: placement.y,
			textTop: renderTop,
			textBottom: renderBottom,
			slideBottom,
			slideTop,
		})
		if (fullyOff) {
			excludedNodePaths.add(JSON.stringify(nodePath))
		}
	}

	return { issues, excludedNodePaths }
}

/**
 * Estimate the rendered text height in blocks for a text element.
 * Three regimes, matching how the layout pipeline builds the entity:
 *   - scroll `<code>`: `(viewportCodeRows + 2) * lineHeight` (the chunk
 *     is bordered + scrolled chunk slices)
 *   - non-scroll `<code>`: count newlines in the bordered content + 2
 *     (top + bottom border), times lineHeight
 *   - prose (`<p>` / `<h*>`): wrap at `width * widthCompensation` and
 *     count visual rows
 */
function estimateTextHeightBlocks(el: TextElementLayout): number {
	const lineHeightBlocks = pxToTextLineHeight(el.scalePx)
	if (lineHeightBlocks <= 0) return 0

	if (el.kind === 'text' && el.type === 'code') {
		// Scrolling code: chunk 0 is the initial render — same row count.
		if (el.chunks && el.chunks.length > 0 && el.viewportCodeRows !== undefined) {
			return (el.viewportCodeRows + 2) * lineHeightBlocks
		}
		// Non-scrolling code: count newlines in borderedContent + borders.
		if (el.borderedContent && el.borderedContent.length > 0) {
			let rows = 2 // top + bottom border
			for (const seg of el.borderedContent) {
				rows += countNewlines(seg.text)
			}
			return rows * lineHeightBlocks
		}
		return 0
	}

	// Prose path — wrap at the element's effective width. Recompute
	// fontId + bold from declarations (matches the layout pipeline's
	// per-element font choice — `<code>` defaults to monocraft, prose
	// to the default font; bold is on for `h1`/`h2` or explicit LESS).
	const wrapWidthPx =
		(el.width?.px ?? Number.POSITIVE_INFINITY) * el.widthCompensation
	const fontId = el.declarations.font ?? (el.type === 'code' ? 'monocraft:default' : DEFAULT_FONT_ID)
	const bold =
		el.type === 'h1' || el.type === 'h2' || el.declarations.bold === 'true'
	const lines = wrapLines(el.content, wrapWidthPx, bold, fontId)
	return lines * lineHeightBlocks
}

function countNewlines(s: string): number {
	let n = 0
	for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 10) n++
	return n
}

function previewFor(el: TextElementLayout): string {
	if (el.kind !== 'text') return ''
	if (el.borderedContent && el.borderedContent.length > 0) {
		// Code blocks: render the first row's text content as the preview.
		const first = el.borderedContent.find(
			(s: { text: string }) =>
				!!s.text && !s.text.startsWith('─') && !s.text.startsWith('└'),
		)
		const src = (first?.text ?? '').replace(/[\n│─]/g, ' ').trim()
		return src.slice(0, 60)
	}
	return el.content.slice(0, 60)
}

/**
 * Compute the rendered region for any visible element. Returns `null`
 * for either bound when the element can't be measured (e.g. unknown kind).
 *   - text/code:    `[entityY, entityY + lineHeight × visualRows]` (text
 *                   extends upward from the entity anchor)
 *   - image:        `[entityY - cellH/2, entityY + cellH/2]` (image is
 *                   centered on its entity anchor)
 */
function estimateRenderBounds(placement: Placement): {
	renderBottom: number | null
	renderTop: number | null
	contentPreview: string
} {
	const el = placement.el
	if (el.kind === 'image') {
		const halfH = el.cellH / 2
		return {
			renderBottom: placement.y - halfH,
			renderTop: placement.y + halfH,
			contentPreview: `<img src="${el.imgSrc ?? ''}">`,
		}
	}
	if (el.kind === 'text') {
		const textHeight = estimateTextHeightBlocks(el)
		if (textHeight <= 0) {
			return { renderBottom: null, renderTop: null, contentPreview: '' }
		}
		return {
			renderBottom: placement.y,
			renderTop: placement.y + textHeight,
			contentPreview: previewFor(el),
		}
	}
	return { renderBottom: null, renderTop: null, contentPreview: '' }
}

/**
 * Pretty-print a diagnostic report to stderr via `console.warn`. Each
 * issue includes the slide index, the kind (`full` vs `partial`), the
 * rendered text bounds vs the slide bounds, and a content preview.
 */
export function formatIssues(issues: readonly OffScreenIssue[]): string {
	if (issues.length === 0) return ''
	const grouped = new Map<number, OffScreenIssue[]>()
	for (const issue of issues) {
		const list = grouped.get(issue.slideIdx) ?? []
		list.push(issue)
		grouped.set(issue.slideIdx, list)
	}
	const lines: string[] = []
	const sortedSlides = Array.from(grouped.keys()).sort((a, b) => a - b)
	for (const slideIdx of sortedSlides) {
		const issues = grouped.get(slideIdx)!
		lines.push(`Slide ${slideIdx}: ${issues.length} off-screen element(s)`)
		for (const issue of issues) {
			lines.push(
				`  ${issue.kind === 'full' ? 'FULLY ' : 'PARTIAL '}off-screen: ${JSON.stringify(issue.contentPreview)}`,
			)
			lines.push(
				`    entity Y=${issue.entityY.toFixed(3)}, rendered bounds [${issue.textBottom.toFixed(3)}, ${issue.textTop.toFixed(3)}], slide [${issue.slideBottom}, ${issue.slideTop}]`,
			)
		}
	}
	return lines.join('\n')
}

/**
 * Drop `visible` entries whose node path is in `excludedNodePaths`. Used
 * after the diagnostic runs to prevent fully off-screen elements from
 * being summoned at all.
 */
export function filterVisible(
	visible: readonly { node: unknown; path: readonly string[] }[],
	excludedNodePaths: Set<string>,
): typeof visible[number][] {
	if (excludedNodePaths.size === 0) return visible.slice()
	return visible.filter((v) => !excludedNodePaths.has(JSON.stringify(v.path)))
}