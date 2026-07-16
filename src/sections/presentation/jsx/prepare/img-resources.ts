// Register a `Model` + `ItemModelDefinition` for every distinct `<img>`
// src across all slides. Both names stay in sync — the renderer looks
// them up via the same `imgResources` map.

import path from 'node:path'
import sharp from 'sharp'
import { Model, ItemModelDefinition, TextureClass } from 'sandstone'
import type { VNode } from '../render'
import { flatWalk } from '../tree/walk'
import { isImgType } from '../layout/element'
import type { ImgResourceMap } from '../layout/element'
import { NAMESPACE } from '@shared'

export function resolveImgSrc(src: string | TextureClass): string {
	if (typeof src === 'string') return src
	return `${src.path[0]}:${src.path.slice(2).join('/')}`
}

export async function prepareImgResources(trees: VNode[]): Promise<ImgResourceMap> {
	const seen = new Set<string>()
	const out: ImgResourceMap = new Map()
	const projectRoot = process.cwd()

	for (const tree of trees) {
		for (const { node } of flatWalk(tree)) {
			if (!isImgType(node.type)) continue
			const rawSrc: undefined | string | TextureClass = node.props?.src
			if (rawSrc === undefined) continue
			// TODO: Sandstone bug, replace with `${rawSrc}` once its fixed
			const src = resolveImgSrc(rawSrc)
			if (!src || seen.has(src)) continue
			seen.add(src)

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
			if (typeof rawSrc === 'string') {
				const filePath = `${path.join(projectRoot, 'resources', 'resourcepack', 'assets', namespace, 'textures', ...modelPath)}.png`
				try {
					const meta = await sharp(filePath).metadata()
					if (meta.width && meta.height) aspect = meta.width / meta.height
				} catch (e: any) {
					console.warn(`[img] failed to read texture ${filePath}: ${e?.message ?? e}; defaulting to 1:1 aspect`)
				}
			} else {
				try {
					const buf = await rawSrc.buffer
					if (buf) {
						const meta = await sharp(buf).metadata()
						if (meta.width && meta.height) aspect = meta.width / meta.height
					}
				} catch (e: any) {
					console.warn(`[img] failed to read TextureClass buffer for ${src}: ${e?.message ?? e}; defaulting to 1:1 aspect`)
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
						})
					},
				})
			})
		}
	}
	return out
}