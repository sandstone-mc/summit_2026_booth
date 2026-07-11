// Per-element layout — one ElementLayout per visible JSX element with
// everything the summon pass needs (cell size, scale, margins, content).

import { parseLength, pxToTextScale, pxToTextLineHeight } from '../length'
import { charWidth, wrapLines, wrapCodeLines } from '../text-metrics'
import { DEFAULT_FONT_ID } from '../text-metrics/font-loader'
import type { CssDeclarations } from '../less/types'
import type { VNode, StyledSegment } from '../render'
import type { NodeWithPath } from '../tree/walk'
import type { Styles } from '../style'
import type { Precomputed } from './code-borders'
import { CodeBorders } from './code-borders'
import { DEFAULT_CODE_BORDER_COLOR, DEFAULT_CODE_LANG_COLOR, DEFAULT_IMG_HEIGHT, defaultFontPx } from './constants'
import { parseMarginBox } from './margin'
import { extractCodeSource, extractText } from '../tree/extract'

const codeBorders = new CodeBorders()

type TextElementLayout = {
	kind: 'text'
	node: VNode
	path: string[]
	parentStack: CssDeclarations
	declarations: CssDeclarations
	type: string
	content: string
	borderedContent?: StyledSegment[]
	width: ReturnType<typeof parseLength>
	scalePx: number
	textScale: number
	widthCompensation: number
	cellH: number
	cellW: number
	marginTop: number
	marginBottom: number
	imgSrc?: undefined
	imgItemModel?: undefined
	imgAspect?: undefined
}

type ImageElementLayout = {
	kind: 'image'
	node: VNode
	path: string[]
	parentStack: CssDeclarations
	declarations: CssDeclarations
	type: string
	content: string
	borderedContent?: undefined
	width: ReturnType<typeof parseLength>
	scalePx: number
	textScale: number
	widthCompensation: number
	cellH: number
	cellW: number
	marginTop: number
	marginBottom: number
	imgSrc: string
	imgItemModel: string
	imgAspect: number
}

export type ElementLayout = TextElementLayout | ImageElementLayout

export type ImgResource = {
	src: string
	aspect: number
	itemModel: string
}
export type ImgResourceMap = Map<string, ImgResource>

// Element-type predicates used across the render + prepare passes.
const TEXT_TYPES = new Set(['h1', 'h2', 'p', 'code'])
const IMG_TYPES = new Set(['img'])

export function isTextType(t: any): boolean {
	return TEXT_TYPES.has(String(t))
}

export function isImgType(t: any): boolean {
	return IMG_TYPES.has(String(t))
}

export function isVisibleType(t: any): boolean {
	return isTextType(t) || isImgType(t)
}

export { TEXT_TYPES, IMG_TYPES }

// Baseline text scale used to compute per-element width compensation.
// Without compensation, an h1 (scale 6) renders ~2.4× wider per default-
// font pixel than a p (scale 2.5) and overflows the cell before MC wraps.
const BASELINE_TEXT_SCALE = pxToTextScale(10)

// Build the layout record for a single visible element.
export function computeElementLayout(
	nodeWithPath: NodeWithPath,
	styles: Styles,
	sceneW: number,
	sceneH: number,
	imgResources: ImgResourceMap,
	codePrecomputed: WeakMap<VNode, Precomputed>,
): ElementLayout {
	const { node, path } = nodeWithPath
	const parentStack =
		path.length === 0 ? ({} as CssDeclarations) : styles.forPathCached(path.slice(0, -1))
	const declarations = styles.forPath(path)
	const type = String(node.type)

	if (type === 'img') {
		return computeImgLayout(node, path, parentStack, declarations, sceneW, sceneH, imgResources)
	}

	return computeTextLayout(node, path, parentStack, declarations, type, sceneW, sceneH, codePrecomputed)
}

function computeImgLayout(
	node: VNode,
	path: string[],
	parentStack: CssDeclarations,
	declarations: CssDeclarations,
	sceneW: number,
	sceneH: number,
	imgResources: ImgResourceMap,
): ElementLayout {
	const src = String(node.props?.src ?? '')
	const resource = imgResources.get(src)
	if (!resource) {
		throw new Error(
			`<img src="${src}"> is missing a registered resource — every src must be prepared via prepareImgResources before render.`,
		)
	}
	// Dimension resolution: `height` prop → LESS `height` → default.
	// Width defaults to height × aspect so the image doesn't distort.
	const heightRaw =
		(typeof node.props?.height === 'string' && node.props.height) ||
		declarations.height ||
		DEFAULT_IMG_HEIGHT
	const widthRaw =
		(typeof node.props?.width === 'string' && node.props.width) || declarations.width || ''
	const heightLen = parseLength(heightRaw, sceneH)
	const explicitWidth = widthRaw ? parseLength(widthRaw, sceneW) : undefined
	const cellH = heightLen?.meters ?? parseLength(DEFAULT_IMG_HEIGHT, sceneH)!.meters
	const cellW = explicitWidth?.meters ?? cellH * resource.aspect
	const { top: marginTop, bottom: marginBottom } = parseMarginBox(declarations, sceneH)
	return {
		kind: 'image',
		node,
		path,
		parentStack,
		declarations,
		type: 'img',
		content: '',
		width: undefined,
		scalePx: 0,
		textScale: 0,
		widthCompensation: 1,
		cellH,
		cellW,
		marginTop,
		marginBottom,
		imgSrc: src,
		imgItemModel: resource.itemModel,
		imgAspect: resource.aspect,
	}
}

function computeTextLayout(
	node: VNode,
	path: string[],
	parentStack: CssDeclarations,
	declarations: CssDeclarations,
	type: string,
	sceneW: number,
	sceneH: number,
	codePrecomputed: WeakMap<VNode, Precomputed>,
): ElementLayout {
	const content = type === 'code' ? extractCodeSource(node.props) : extractText(node.props?.children)

	const fontSize = parseLength(declarations['font-size'] ?? '', sceneH)
	const width = parseLength(declarations.width ?? '', sceneW)

	const scalePx = fontSize?.px ?? defaultFontPx(type)
	const textScale = pxToTextScale(scalePx) // NBT `transformation.scale`

	// `<code>` defaults to monocraft unless LESS overrides.
	const fontId = declarations.font ?? (type === 'code' ? 'monocraft:default' : DEFAULT_FONT_ID)

	const widthCompensation = BASELINE_TEXT_SCALE / textScale

	const heightLen = parseLength(declarations.height ?? '', sceneH)
	const isBold = type === 'h1' || type === 'h2' || declarations.bold === 'true'
	const wrapWidthPx = (width?.px ?? Number.POSITIVE_INFINITY) * widthCompensation

	const codeColor = declarations.color as `#${string}` | undefined
	// `<code>` gets dim border + saturated tag so the box reads as code.
	const borderColor =
		(declarations['border-color'] as `#${string}` | undefined) ??
		(type === 'code' ? DEFAULT_CODE_BORDER_COLOR : codeColor)
	const langColor =
		(declarations['lang-color'] as `#${string}` | undefined) ??
		(type === 'code' ? DEFAULT_CODE_LANG_COLOR : codeColor)
	const codeBordered: StyledSegment[] | undefined =
		type === 'code'
			? codeBorders.wrap(
					content,
					String(node.props?.lang ?? ''),
					fontId,
					wrapWidthPx,
					isBold,
					borderColor,
					langColor,
					codeColor,
					codePrecomputed.get(node),
				)
			: undefined

	const renderText = codeBordered ? codeBordered.map((s) => s.text).join('') : content
	const lines =
		type === 'code'
			? wrapCodeLines(renderText, wrapWidthPx, isBold, fontId)
			: wrapLines(content, wrapWidthPx, isBold, fontId)
	const cellH = heightLen?.meters ?? pxToTextLineHeight(scalePx) * lines
	const { top: marginTop, bottom: marginBottom } = parseMarginBox(declarations, sceneH)
	return {
		kind: 'text',
		node,
		path,
		parentStack,
		declarations,
		type,
		content,
		borderedContent: codeBordered,
		width,
		scalePx,
		textScale,
		widthCompensation,
		cellH,
		cellW: sceneW,
		marginTop,
		marginBottom,
	}
}