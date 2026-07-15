// Register a `Model` + `ItemModelDefinition` for every distinct `<img>`
// src across all slides. Both names stay in sync — the renderer looks
// them up via the same `imgResources` map.

import path from 'node:path'
import sharp from 'sharp'
import { Model, ItemModelDefinition, TextureClass } from 'sandstone'
import type { VNode } from '../render'
import { flatWalk } from '../tree/walk'
import { isImgType } from '../layout/element'
import type { ImgResource, ImgResourceMap } from '../layout/element'

export function resolveImgSrc(src: string | TextureClass): string {
	return typeof src === 'string' ? src : src.toString()
}

export async function prepareImgResources(trees: VNode[]): Promise<ImgResourceMap> {
	const seen = new Set<string>()
	const out: ImgResourceMap = new Map()
	const projectRoot = process.cwd()

	for (const tree of trees) {
		for (const { node } of flatWalk(tree)) {
			if (!isImgType(node.type)) continue
			const rawSrc = node.props?.src
			if (!rawSrc) continue
			const src = resolveImgSrc(rawSrc)
			if (!src || seen.has(src)) continue
			seen.add(src)

			const colonIdx = src.indexOf(':')
			if (colonIdx <= 0) {
				console.warn(`[img] src "${src}" is not a resource location (expected "<ns>:<path>"); skipping`)
				continue
			}
			const ns = src.slice(0, colonIdx)
			const textureNoExt = src.slice(colonIdx + 1)

			let aspect = 1
			if (typeof rawSrc === 'string') {
				const filePath = path.join(projectRoot, 'resources', 'resourcepack', 'assets', ns, 'textures', `${textureNoExt}.png`)
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

			Model('item', textureNoExt, {
				parent: 'minecraft:item/generated',
				textures: { layer0: `${ns}:${textureNoExt}` },
			})
			ItemModelDefinition(textureNoExt, {
				model: { type: 'minecraft:model', model: `${ns}:item/${textureNoExt}` },
			})

			const resource: ImgResource = { src, aspect, itemModel: `${ns}:${textureNoExt}` }
			out.set(src, resource)
		}
	}
	return out
}