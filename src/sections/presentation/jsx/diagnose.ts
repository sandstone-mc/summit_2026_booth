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

import type { ComponentLayoutBase } from './components/base'
import type { CodeLayout } from './components/code/code-layout'
import type { ProseLayout } from './components/prose/prose-base'
import type { ExplorerLayout } from './components/explorer/explorer-layout'
import type { AutocompleteLayout } from './components/autocomplete/autocomplete-layout'
import type { ImageLayout } from './components/image/image-component'
import type { Placement } from './layout'
import { wrapLines } from './text-metrics'
import { pxToTextLineHeight } from './length'
import { DEFAULT_FONT_ID } from './text-metrics/font-loader'
import { TEXT_RENDER_OFFSET, parityOffset } from './layout/constants'
import type { VNode } from './render'

// Code-shaped layouts share bordered-row + chunk fields. Used inside
// the diagnostic to narrow `el: TextLayout` after a `type === 'code'`
// or `type === 'explorer'` check.
type CodeLikeLayout = CodeLayout | ExplorerLayout
// All text-style layouts share kind='text' + the common render
// fields. Union — narrowing by `type` accesses variant-specific fields.
type TextLayout = CodeLayout | ProseLayout | ExplorerLayout | AutocompleteLayout

export type OffScreenKind = 'partial' | 'full'

export type OffScreenIssue = {
	slideIdx: number
	kind: OffScreenKind
	nodePath: string
	entityY: number
	entityX: number
	textTop: number | null
	textBottom: number | null
	textLeft: number | null
	textRight: number | null
	slideBottom: number
	slideTop: number
	slideLeft: number
	slideRight: number
	offAxis: ('vertical' | 'horizontal')[]
	contentPreview: string
}

export type PlacementForIssue = Placement

export type DiagnoseResult = {
	issues: OffScreenIssue[]
	excludedVNodes: Set<VNode>
}

/**
 * Run the off-screen diagnostic across every placement. Returns the
 * list of issues + the set of VNodes whose placements are fully off-
 * screen (caller should drop them from `slideVisibles` so the slide
 * show never summons them).
 */
export function diagnosePlacements(
	placements: readonly Placement[],
	slideIdx: number,
	originX: number,
	originY: number,
	sceneW: number,
	sceneH: number,
): DiagnoseResult {
	const slideBottom = originY
	const slideTop = originY + sceneH
	const slideLeft = originX
	const slideRight = originX + sceneW

	const issues: OffScreenIssue[] = []
	const excludedVNodes = new Set<VNode>()

	for (const placement of placements) {
		const el = placement.el
		const bounds = renderBounds(el, placement, sceneH)
		if (!bounds) continue

		const nodePath = pathString(el)
		const textBottom = bounds.renderBottom ?? 0
		const textTop = bounds.renderTop ?? 0
		const textLeft = bounds.renderLeft ?? 0
		const textRight = bounds.renderRight ?? 0

		const fullyOff =
			textBottom >= slideTop ||
			textTop <= slideBottom ||
			textLeft >= slideRight ||
			textRight <= slideLeft
		const partialOff =
			textBottom > slideTop ||
			textTop > slideBottom ||
			textLeft > slideRight ||
			textRight > slideLeft
		if (!fullyOff && !partialOff) continue

		const offAxis: ('vertical' | 'horizontal')[] = []
		if (textBottom >= slideTop || textTop <= slideBottom) offAxis.push('vertical')
		if (textLeft >= slideRight || textRight <= slideLeft) offAxis.push('horizontal')

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
		if (fullyOff) excludedVNodes.add(el.node)
	}

	return { issues, excludedVNodes }
}

function pathString(el: ComponentLayoutBase): string {
	const parts = el.path
	if (parts.length === 0) return String(el.type)
	return parts.join(' > ')
}

type RenderBounds = {
	renderBottom: number | null
	renderTop: number | null
	renderLeft: number | null
	renderRight: number | null
	contentPreview: string
}

function renderBounds(
	el: ComponentLayoutBase,
	placement: Placement,
	sceneH: number,
): RenderBounds | null {
	if (el.kind === 'image') {
		const halfH = el.cellH / 2
		const halfW = el.cellW / 2
		const imgEl = el as ImageLayout
		return {
			renderBottom: placement.y - halfH,
			renderTop: placement.y + halfH,
			renderLeft: placement.x - halfW,
			renderRight: placement.x + halfW,
			contentPreview: `<img src="${imgEl.imgSrc ?? ''}">`,
		}
	}
	if (el.kind === 'text') {
		const textEl = el as TextLayout
		const textHeight = estimateTextHeightBlocks(textEl)
		if (textHeight <= 0) {
			return { renderBottom: null, renderTop: null, renderLeft: null, renderRight: null, contentPreview: '' }
		}
		const textWidth = estimateTextWidthBlocks(textEl)
		const centered = el.type !== 'code'
		const halfW = textWidth / 2
		const lift = TEXT_RENDER_OFFSET - parityOffset(sceneH)
		return {
			renderBottom: placement.y + lift,
			renderTop: placement.y + textHeight + lift,
			renderLeft: centered ? placement.x - halfW : placement.x,
			renderRight: centered ? placement.x + halfW : placement.x + textWidth,
			contentPreview: previewFor(textEl),
		}
	}
	return { renderBottom: null, renderTop: null, renderLeft: null, renderRight: null, contentPreview: '' }
}

/**
 * Approximate the rendered text width in blocks. Uses the element's
 * LESS `width` declaration (in px, 1 block = 16 px) as the wrap width.
 * `line_width` is in pre-scale pixels so doesn't map directly to blocks.
 */
function estimateTextWidthBlocks(el: TextLayout): number {
	if (!('styleWidth' in el) || !el.styleWidth) return 0
	return el.styleWidth.px / 16
}

/**
 * Estimate the rendered text height in blocks for a text element.
 * Three regimes, matching how the layout pipeline builds the entity:
 *   - scroll `<code>` / `<explorer>`: `(viewportCodeRows + 2) * lineHeight`
 *   - non-scroll `<code>` / `<explorer>`: count newlines in borderedContent + 2
 *   - prose (`<p>` / `<h*>` / `<autocomplete>`): wrap at `width *
 *     widthCompensation` and count visual rows
 */
function estimateTextHeightBlocks(el: TextLayout): number {
	const lineHeightBlocks = pxToTextLineHeight(el.scalePx, el.fontId)
	if (lineHeightBlocks <= 0) return 0

	if (el.type === 'code' || el.type === 'explorer') {
		const codeLike = el as CodeLikeLayout
		if (codeLike.chunks && codeLike.chunks.length > 0 && codeLike.viewportCodeRows !== undefined) {
			return (codeLike.viewportCodeRows + 2) * lineHeightBlocks
		}
		if (codeLike.borderedContent && codeLike.borderedContent.length > 0) {
			let rows = 2
			for (const seg of codeLike.borderedContent) {
				rows += countNewlines(seg.text)
			}
			return rows * lineHeightBlocks
		}
		return 0
	}

	// Prose path — when the caller pinned the breaks via
	// `wrap-breaks`, trust that count instead of re-running the wrap
	// guess. AutocompleteLayout shares `content` + `widthCompensation`
	// + `styleWidth` + `declarations` with ProseLayout but lacks
	// `wrapBreaksApplied`; the optional access via `?.` keeps both
	// branches compiling.
	const proseLike = el as ProseLayout
	if (proseLike.wrapBreaksApplied !== undefined) {
		const lines = proseLike.wrapBreaksApplied.length === 0 ? 1 : proseLike.wrapBreaksApplied.length + 1
		return lines * lineHeightBlocks
	}
	const wrapWidthPx =
		(proseLike.styleWidth?.px ?? Number.POSITIVE_INFINITY) * proseLike.widthCompensation
	const fontId = proseLike.declarations.font ?? DEFAULT_FONT_ID
	const bold =
		el.type === 'h1' || el.type === 'h2' || proseLike.declarations.bold === 'true'
	const lines = wrapLines(proseLike.content, wrapWidthPx, bold, fontId)
	return lines * lineHeightBlocks
}

function countNewlines(s: string): number {
	let n = 0
	for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 10) n++
	return n
}

function previewFor(el: TextLayout): string {
	if (el.kind !== 'text') return ''
	if ('borderedContent' in el && el.borderedContent && el.borderedContent.length > 0) {
		const first = el.borderedContent.find(
			(s) => !!s.text && !s.text.startsWith('─') && !s.text.startsWith('└'),
		)
		const src = (first?.text ?? '').replace(/[\n│─]/g, ' ').trim()
		return src.slice(0, 60)
	}
	return el.content.slice(0, 60)
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
					`Y: rendered [${(issue.textBottom ?? 0).toFixed(2)}, ${(issue.textTop ?? 0).toFixed(2)}], slide [${issue.slideBottom}, ${issue.slideTop}]`,
				)
			}
			if (issue.offAxis.includes('horizontal')) {
				parts.push(
					`X: rendered [${(issue.textLeft ?? 0).toFixed(2)}, ${(issue.textRight ?? 0).toFixed(2)}], slide [${issue.slideLeft}, ${issue.slideRight}]`,
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