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
//
// Identity for exclusion uses the VNode reference (not the JSX path) —
// sibling elements without distinguishing id/class share the same
// path string, which would cause the exclusion Set to over-match.

import type { ElementLayout } from './layout/element'
import type { Placement } from './layout'
import { wrapLines } from './text-metrics'
import { pxToTextLineHeight } from './length'
import { DEFAULT_FONT_ID } from './text-metrics/font-loader'
import type { VNode } from './render'

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
	entityX: number
	textTop: number
	textBottom: number
	textLeft: number
	textRight: number
	slideBottom: number
	slideTop: number
	slideLeft: number
	slideRight: number
	/** Which axes are clipped: 'vertical', 'horizontal', or both. */
	offAxis: string[]
}

export type DiagnoseResult = {
	issues: OffScreenIssue[]
	/** VNode references of fully-off-screen elements — caller may skip these. */
	excludedVNodes: Set<VNode>
}

/**
 * Scan a list of placements and flag elements whose rendered region
 * doesn't fit inside the slide. Checks both vertical (Y) and horizontal
 * (X) bounds. `originY` / `originX` are the slide's bottom-left corner
 * in world coords; `sceneW` / `sceneH` are the slide dimensions.
 */
export function diagnosePlacements(
	placements: readonly Placement[],
	slideIdx: number,
	originX: number,
	originY: number,
	sceneW: number,
	sceneH: number,
): DiagnoseResult {
	const slideLeft = originX
	const slideRight = originX + sceneW
	const slideBottom = originY
	const slideTop = originY + sceneH
	const issues: OffScreenIssue[] = []
	const excludedVNodes = new Set<VNode>()

	for (const placement of placements) {
		const bounds = estimateRenderBounds(placement)
		if (
			bounds.renderBottom === null ||
			bounds.renderTop === null ||
			bounds.renderLeft === null ||
			bounds.renderRight === null
		) {
			continue
		}
		const fullyOffY = bounds.renderTop <= slideBottom || bounds.renderBottom >= slideTop
		const fullyOffX = bounds.renderRight <= slideLeft || bounds.renderLeft >= slideRight
		const partialOffY =
			!fullyOffY && (bounds.renderBottom < slideBottom || bounds.renderTop > slideTop)
		const partialOffX =
			!fullyOffX && (bounds.renderLeft < slideLeft || bounds.renderRight > slideRight)
		const fullyOff = fullyOffY || fullyOffX
		if (!fullyOff && !partialOffY && !partialOffX) continue

		const nodePath = placement.el.path
		const offAxis: string[] = []
		if (fullyOffY || partialOffY) offAxis.push('vertical')
		if (fullyOffX || partialOffX) offAxis.push('horizontal')

		issues.push({
			slideIdx,
			kind: fullyOff ? 'full' : 'partial',
			contentPreview: bounds.contentPreview,
			nodePath,
			entityY: placement.y,
			entityX: placement.x,
			textTop: bounds.renderTop,
			textBottom: bounds.renderBottom,
			textLeft: bounds.renderLeft,
			textRight: bounds.renderRight,
			slideBottom,
			slideTop,
			slideLeft,
			slideRight,
			offAxis,
		})
		if (fullyOff) {
			excludedVNodes.add(placement.el.node)
		}
	}

	return { issues, excludedVNodes }
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
 * for any bound that can't be measured.
 *   - text/code:    `[entityY, entityY + lineHeight × visualRows]` vertically
 *                   (text extends upward from the entity anchor); horizontally
 *                   `[entityX, entityX + textWidth]` for left-aligned code,
 *                   `[entityX - textWidth/2, entityX + textWidth/2]` for prose.
 *   - image:        `[entityY ± cellH/2, entityX ± cellW/2]` (centered).
 */
function estimateRenderBounds(placement: Placement): {
	renderBottom: number | null
	renderTop: number | null
	renderLeft: number | null
	renderRight: number | null
	contentPreview: string
} {
	const el = placement.el
	if (el.kind === 'image') {
		const halfH = el.cellH / 2
		const halfW = el.cellW / 2
		return {
			renderBottom: placement.y - halfH,
			renderTop: placement.y + halfH,
			renderLeft: placement.x - halfW,
			renderRight: placement.x + halfW,
			contentPreview: `<img src="${el.imgSrc ?? ''}">`,
		}
	}
	if (el.kind === 'text') {
		const textHeight = estimateTextHeightBlocks(el)
		if (textHeight <= 0) {
			return {
				renderBottom: null,
				renderTop: null,
				renderLeft: null,
				renderRight: null,
				contentPreview: '',
			}
		}
		const textWidth = estimateTextWidthBlocks(el)
		// `<code>` defaults to `alignment: 'left'`; prose uses MC's default
		// (centered). Treat everything except `code` as centered.
		const centered = el.type !== 'code'
		const halfW = textWidth / 2
		return {
			renderBottom: placement.y,
			renderTop: placement.y + textHeight,
			renderLeft: centered ? placement.x - halfW : placement.x,
			renderRight: centered ? placement.x + halfW : placement.x + textWidth,
			contentPreview: previewFor(el),
		}
	}
	return {
		renderBottom: null,
		renderTop: null,
		renderLeft: null,
		renderRight: null,
		contentPreview: '',
	}
}

/**
 * Approximate the rendered text width in blocks. Uses the element's
 * LESS `width` declaration (in px, 1 block = 16 px) as the wrap width.
 * `line_width` is in pre-scale pixels so doesn't map directly to blocks.
 */
function estimateTextWidthBlocks(el: TextElementLayout): number {
	if (el.kind !== 'text') return 0
	if (el.width) return el.width.px / 16
	return 0
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
				`  ${issue.kind === 'full' ? 'FULLY ' : 'PARTIAL '}off-screen (${issue.offAxis.join('+')}): ${JSON.stringify(issue.contentPreview)}`,
			)
			const parts: string[] = []
			if (issue.offAxis.includes('vertical')) {
				parts.push(
					`Y: rendered [${issue.textBottom.toFixed(2)}, ${issue.textTop.toFixed(2)}], slide [${issue.slideBottom}, ${issue.slideTop}]`,
				)
			}
			if (issue.offAxis.includes('horizontal')) {
				parts.push(
					`X: rendered [${issue.textLeft.toFixed(2)}, ${issue.textRight.toFixed(2)}], slide [${issue.slideLeft}, ${issue.slideRight}]`,
				)
			}
			lines.push(`    ${parts.join('; ')}`)
		}
	}
	return lines.join('\n')
}

/**
 * Drop `visible` entries whose VNode is in `excludedVNodes`. Used after
 * the diagnostic runs to prevent fully off-screen elements from being
 * summoned at all. Uses VNode identity (not path) so sibling elements
 * without distinguishing id/class aren't over-matched.
 */
export function filterVisibleByVNode<T extends { node: VNode }>(
	visible: readonly T[],
	excludedVNodes: Set<VNode>,
): T[] {
	if (excludedVNodes.size === 0) return visible.slice()
	return visible.filter((v) => !excludedVNodes.has(v.node))
}