// ImageComponent — handles `<img>`. Renders PNGs via item_display +
// `minecraft:item_model`. Image resources are registered by the
// `prepare()` pass (which reads PNG buffers via sharp and creates
// `Model` + `ItemModelDefinition` per distinct src).

import {
	NBT,
	summon as mcSummon,
	Model,
	ItemModelDefinition,
	type LabelClass,
} from 'sandstone'
import type { SymbolEntity } from 'sandstone/arguments'
import sharp from 'sharp'
import { parseLength } from '../../length'
import { parseMarginBox } from '../../layout/margin'
import type { ComponentLayoutBase, LayoutCtx, SummonCtx } from '../base'
import { ComponentBase } from '../base'
import { fmt, FULL_BRIGHTNESS, ROTATION_QUATERNION, ZERO_TRANSLATION } from '../summon-helpers'
import path from 'path'

const NAMESPACE = 'sandstone_summit_booth'
import type { VNode } from '../../render'
import type { CssDeclarations } from '../../less/types'
import type { Styles } from '../../style'
import type { NodeWithPath } from '../../tree/walk'
import type { TextureClass } from 'sandstone'
import { PROJECT_ROOT } from 'src/shared';

// Register the `<img>` slot in the precomputed bag.
declare module '../base' {
	interface PrecomputedTypeMap {
		img: ImgResourceMap
	}
}

// `<img>` fallback height when neither prop nor LESS specify one.
const DEFAULT_IMG_HEIGHT = '30vh'

export type ImageLayout = ComponentLayoutBase & {
	kind: 'image'
	type: 'img'
	content: ''
	styleWidth: ReturnType<typeof parseLength>
	scalePx: number
	textScale: number
	widthCompensation: number
	imgSrc: string
	imgItemModel: any
	imgAspect: number
}

export type ImgResource = {
	src: string
	aspect: number
	itemModel: any
}
export type ImgResourceMap = Map<string, ImgResource>

export function resolveImgSrc(src: string | TextureClass): string {
	if (typeof src === 'string') return src
	return `${src.path[0]}:${src.path.slice(2).join('/')}`
}

function computeImgLayout(
	node: VNode,
	path: string[],
	parentStack: CssDeclarations,
	declarations: CssDeclarations,
	sceneW: number,
	sceneH: number,
	imgResources: ImgResourceMap,
): ImageLayout {
	const src = resolveImgSrc(node.props?.src)
	const resource = imgResources.get(src)
	if (!resource) {
		throw new Error(
			`<img src="${src}"> is missing a registered resource — every src must be prepared via prepareImgResources before render.`,
		)
	}
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
		styleWidth: undefined,
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

export function imageLayoutFor(
	nw: NodeWithPath,
	styles: Styles,
	sceneW: number,
	sceneH: number,
	imgResources: ImgResourceMap,
): ImageLayout {
	const { node, path } = nw
	const parentStack =
		path.length === 0 ? ({} as CssDeclarations) : styles.forPathCached(path.slice(0, -1))
	const declarations = styles.forPath(path)
	return computeImgLayout(node, path, parentStack, declarations, sceneW, sceneH, imgResources)
}

export function imageSummon(
	el: ImageLayout,
	entityX: number,
	entityY: number,
	z: number,
	extraTags: (`${any}${string}` | LabelClass)[],
	sceneTag: LabelClass,
	initialOpacity: number | undefined,
): void {
	const imgNbt: SymbolEntity['item_display'] = {
		Tags: [sceneTag, ...extraTags],
		item: {
			id: 'minecraft:paper',
			count: NBT.int(1),
			components: {
				// SNBT keys with `:` must be pre-quoted to dodge the parser
				// treating the colon as a type-tag.
				/* @ts-ignore // TODO: Sandstone bug */
				'"minecraft:item_model"': `${el.imgItemModel}`,
			},
		},
		item_display: 'fixed',
		transformation: {
			scale: NBT.float([el.cellW, el.cellH, 1]),
			translation: ZERO_TRANSLATION,
			left_rotation: ROTATION_QUATERNION,
			right_rotation: ROTATION_QUATERNION,
		},
		brightness: FULL_BRIGHTNESS,
	}
	if (initialOpacity === 0) imgNbt.view_range = NBT.float(0.0)
	mcSummon('minecraft:item_display', `${fmt(entityX)} ${fmt(entityY)} ${fmt(z)}`, imgNbt)
}

export class ImageComponent extends ComponentBase {

	constructor(readonly props: { src: string | TextureClass, height: string }) {
		super(props)
	}

	readonly type = 'img'
	isVisible(): boolean { return true }

	computeLayout(ctx: LayoutCtx): ComponentLayoutBase {
		const imgResources = ctx.precomputedBag?.img ?? new Map<string, ImgResource>()
		return computeImgLayout(
			ctx.node.node,
			ctx.node.path,
			ctx.parentStack,
			ctx.declarations,
			ctx.sceneW, ctx.sceneH,
			imgResources,
		)
	}

	summon(ctx: SummonCtx): void {
		imageSummon(
			ctx.el as unknown as ImageLayout,
			ctx.entityX, ctx.entityY, ctx.z,
			ctx.extraTags, ctx.sceneTag, ctx.initialOpacity,
		)
	}

	static is(component: unknown & { type: 'string' | unknown }): asserts component is ImageComponent {
		if (component.type !== 'img') {
			throw new Error(`[sandstone-jsx] Expected <img />, got ${component.type}`)
		}
	} 

	// Register every distinct `<img src>` with sharp-buffer-based
	// `Model` + `ItemModelDefinition`. Result map is consumed by
	// the layout pass at compute-time.
	async prepare(ctx: { visiblePerSlide: readonly NodeWithPath[][]; result: unknown }): Promise<void> {
		const out = new Map<string, ImgResource>()
		for (const visible of ctx.visiblePerSlide) {
			for (const { node } of visible) {
				if (node.type !== 'img') continue
				ImageComponent.is(node)
				// TODO: Sandstone bug, replace with `${node.props.src}` once its fixed
				const src = resolveImgSrc(node.props.src)

				if (out.has(src)) continue

				const [ namespace, modelType, ...modelPath ] = src.split('/').flatMap((part, i) => {
					if (i === 0) {
						const colonI = part.indexOf(':')

						if (colonI !== -1) {
							return [part.slice(0, colonI), part.slice(colonI + 1)]
						}
						return [NAMESPACE, part]
					}
					return part
				})

				let aspect = 1

				if (typeof node.props.src === 'string') {
					const filePath = `${path.join(PROJECT_ROOT, 'resources', 'resourcepack', 'assets', namespace, 'textures', ...modelPath)}.png`
					try {
						const meta = await sharp(filePath).metadata()
						if (meta.width && meta.height) aspect = meta.width / meta.height
					} catch (e: any) {
						console.warn(`[img] failed to read texture ${filePath}: ${e?.message ?? e}; defaulting to 1:1 aspect`)
					}
				} else {
					const buf = await node.props.src.buffer
					if (buf) {
						const meta = await sharp(buf).metadata()
						if (meta.width && meta.height) aspect = meta.width / meta.height
					} else {
						throw new Error(`[sandstone-jsx] img#prepare: TextureClass ${node.props.src} was created without an image buffer promise`)
					}
				}

				out.set(src, {
					src,
					aspect,
					itemModel: ItemModelDefinition(modelPath.join('/'), {
						model: {
							type: 'minecraft:model',
							model: Model(modelType as 'item', modelPath.join('/'), {
								parent: 'minecraft:item/generated',
								textures: { layer0: `${namespace}:${modelType}/${modelPath.join('/')}` },
							}),
						},
					}),
				})
			}
		}
		ctx.result = out
	}
}

export { imageSummon as summonImageEntity }
