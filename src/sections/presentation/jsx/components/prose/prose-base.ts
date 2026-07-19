// ProseComponent — abstract base for prose-style elements (h1, h2,
// h3, p). Subclasses set the JSX type + intrinsic-style overrides
// (font-size, bold, …); layout + summon logic is shared.

import { NBT, summon as mcSummon, type LabelClass } from 'sandstone'
import type { SymbolEntity } from 'sandstone/arguments'
import { extractText, parseInlineFormatting } from '../../tree/extract'
import { parseLength, pxToTextLineHeight, pxToTextScale } from '../../length'
import { parseMarginBox } from '../../layout/margin'
import { wrapLines, wrapSegmentedLines, textWidth, charWidth } from '../../text-metrics'
import type { VNode, StyledSegment } from '../../render'
import type { CssDeclarations } from '../../less/types'
import type { Styles } from '../../style'
import type { NodeWithPath } from '../../tree/walk'
import {
	ComponentBase,
	type ComponentLayoutBase,
	type SummonCtx,
} from '../base'
import {
	buildIdentityTransform,
	applyBackgroundColor,
	buildTextJson,
	fmt,
} from '../summon-helpers'
import { KIND_TEXT_TAG } from '../../slides/tags'

// Default inline-code (`` `code` ``) colors for prose. LESS
// overrides via `inline-code-color` / `inline-code-bg`.
const DEFAULT_INLINE_CODE_COLOR = '#9e9e9e' as const
const DEFAULT_INLINE_CODE_BG = '#2d2d2d' as const

export type ProseLayout = ComponentLayoutBase & {
	kind: 'text'
	content: string
	styleWidth: ReturnType<typeof parseLength>
	scalePx: number
	textScale: number
	widthCompensation: number
	fontId: string
	wrapBreaksApplied?: number[]
	styledContent?: StyledSegment[]
}

function parseWrapBreaks(raw: unknown): number[] | undefined {
	if (raw === undefined || raw === null) return undefined
	if (!Array.isArray(raw)) return []
	const out: number[] = []
	for (const v of raw) {
		const n = typeof v === 'number' ? v : Number(v)
		if (Number.isInteger(n) && n >= 0) out.push(n)
	}
	return out
}

// Subclasses override this to set intrinsic font size etc. Preserved
// from the original `defaultFontPx(type)` switch in
// `layout/constants.ts`.
export interface ProseIntrinsicStyle {
	defaultScalePx: number
	defaultBold: boolean
}

export function computeProseLayout(
	node: VNode,
	path: string[],
	parentStack: CssDeclarations,
	declarations: CssDeclarations,
	type: string,
	intrinsic: ProseIntrinsicStyle,
	styles: Styles,
	sceneW: number,
	sceneH: number,
): ProseLayout {
	const content = extractText(node.props?.children)
	const fontSize = parseLength(declarations['font-size'] ?? '', sceneH)
	const scalePx = fontSize?.px ?? intrinsic.defaultScalePx
	const textScale = pxToTextScale(scalePx)
	const BASELINE_TEXT_SCALE = pxToTextScale(10)
	const widthCompensation = BASELINE_TEXT_SCALE / textScale
	const isBold = intrinsic.defaultBold || declarations.bold === 'true'
	const fontId = declarations.font ?? 'minecraft:default'

	const widthRaw =
		(typeof node.props?.width === 'string' && node.props.width) ||
		declarations.width ||
		''
	let width = parseLength(widthRaw, sceneW)

	const wrapWidthPx = (width?.px ?? Number.POSITIVE_INFINITY) * widthCompensation

	const inlineCodeColor =
		(declarations['inline-code-color'] as `#${string}` | undefined) ??
		DEFAULT_INLINE_CODE_COLOR
	const inlineCodeBg =
		(declarations['inline-code-bg'] as `#${string}` | undefined) ??
		DEFAULT_INLINE_CODE_BG
	const parsedSegments = parseInlineFormatting(content, inlineCodeColor, inlineCodeBg)
	const isFormatted = parsedSegments.some(
		(s) => s.bold || s.italic || s.font || s.color || s.background,
	)

	const wrapBreaks = parseWrapBreaks(node.props?.['wrap-breaks'])
	let lines: number
	let wrapBreaksApplied: number[] | undefined
	let styledContent: StyledSegment[] | undefined
	if (isFormatted) {
		styledContent = parsedSegments
		if (wrapBreaks !== undefined) {
			wrapBreaksApplied = wrapBreaks
			lines = wrapBreaks.length === 0 ? 1 : wrapBreaks.length + 1
		} else {
			lines = wrapSegmentedLines(parsedSegments, wrapWidthPx, isBold, fontId).length
		}
	} else if (wrapBreaks !== undefined) {
		wrapBreaksApplied = wrapBreaks
		lines = wrapBreaks.length === 0 ? 1 : wrapBreaks.length + 1
	} else {
		lines = wrapLines(content, wrapWidthPx, isBold, fontId)
	}

	if (width?.unit === 'fit-content') {
		let longestPx = 0
		if (styledContent) {
			for (const seg of styledContent) {
				const bold = seg.bold ?? isBold
				const fontIdForSeg = seg.font ?? fontId
				for (const ch of seg.text) longestPx += charWidth(ch, bold, fontIdForSeg)
			}
		} else {
			longestPx = textWidth(content, isBold, fontId)
		}
		const naturalWidthBlocks = Math.min(sceneW, longestPx / 16)
		width = {
			value: naturalWidthBlocks * 16,
			unit: 'px',
			px: naturalWidthBlocks * 16,
			meters: naturalWidthBlocks,
		}
	}

	const heightLen = parseLength(declarations.height ?? '', sceneH)
	const lineHeightBlocks = pxToTextLineHeight(scalePx, fontId)
	const cellH = heightLen?.meters ?? lineHeightBlocks * lines
	const cellW = width?.meters ?? sceneW
	const { top: marginTop, bottom: marginBottom } = parseMarginBox(declarations, sceneH)

	return {
		kind: 'text',
		node,
		path,
		parentStack,
		declarations,
		type,
		content,
		styleWidth: width,
		scalePx,
		textScale,
		widthCompensation,
		fontId,
		cellH,
		cellW,
		marginTop,
		marginBottom,
		wrapBreaksApplied,
		styledContent,
	}
}

export function proseSummon(
	el: ProseLayout,
	entityX: number,
	entityY: number,
	z: number,
	extraTags: (`${any}${string}` | LabelClass)[],
	sceneTag: LabelClass,
	initialOpacity: number | undefined,
): void {
	const tags: (`${any}${string}` | LabelClass)[] = [sceneTag, ...extraTags, KIND_TEXT_TAG]
	const textContent: string | StyledSegment[] =
		el.styledContent && el.styledContent.length > 0 ? el.styledContent : el.content

	const nbt: SymbolEntity['text_display'] = {
		Tags: tags,
		text: buildTextJson(textContent, el.declarations, el.type),
		transformation: buildIdentityTransform(el.textScale),
	}

	applyBackgroundColor(el.declarations, nbt as unknown as { background?: ReturnType<typeof NBT.int> })
	if (el.styleWidth !== undefined) {
		nbt.line_width = NBT.int(Math.round(el.styleWidth.px * el.widthCompensation))
	} else if (el.declarations['line-width']) {
		nbt.line_width = NBT.int(parseInt(el.declarations['line-width']))
	}
	if (el.declarations.shadow === 'true') nbt.shadow = true
	if (el.declarations['see-through'] === 'true') nbt.see_through = true

	let align: 'center' | 'left' | 'right' | undefined
	const ta = el.declarations['text-align']?.toLowerCase().trim()
	if (ta === 'left' || ta === 'right' || ta === 'center') align = ta
	if (align) nbt.alignment = align

	const opacityStr = el.declarations.opacity
	if (initialOpacity !== undefined) {
		nbt.text_opacity = NBT.int(initialOpacity)
	} else if (opacityStr) {
		// Stored as -256 + bytes — values 0-3 clamp to 255 in MC
		// 1.21.9, so subtract 256 to make those genuinely transparent.
		nbt.text_opacity = NBT.int(Math.round((parseFloat(opacityStr) / 100) * 255) - 256)
	}

	mcSummon('text_display', `${fmt(entityX)} ${fmt(entityY)} ${fmt(z)}`, nbt)
}

// Helper exposed to `layout/index.ts`: the layout pass calls this
// with the right VNode + path, not via the abstract method.
export function proseLayoutFor(
	nw: NodeWithPath,
	type: string,
	intrinsic: ProseIntrinsicStyle,
	styles: Styles,
	sceneW: number,
	sceneH: number,
): ProseLayout {
	const { node, path } = nw
	const parentStack =
		path.length === 0 ? ({} as CssDeclarations) : styles.forPathCached(path.slice(0, -1))
	const declarations = styles.forPath(path)
	return computeProseLayout(node, path, parentStack, declarations, type, intrinsic, styles, sceneW, sceneH)
}

// Abstract base. Subclasses set `type` + intrinsic style in their
// constructor and register themselves on import.
export abstract class ProseComponent extends ComponentBase {
	abstract readonly intrinsic: ProseIntrinsicStyle
	abstract readonly type: string
	isVisible(): boolean { return true }

	summon(ctx: SummonCtx): void {
		proseSummon(
			ctx.el as unknown as ProseLayout,
			ctx.entityX, ctx.entityY, ctx.z,
			ctx.extraTags, ctx.sceneTag, ctx.initialOpacity,
		)
	}
}