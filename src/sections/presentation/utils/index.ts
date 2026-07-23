import { join } from 'path'
import sharp from 'sharp'
import { ItemModelDefinition, Model, TextureClass } from 'sandstone'

import { NAMESPACE } from '@shared'

export async function screenshot(path: `${any}${string}`, ratio = 8) {
	const imagePath = `${join(process.cwd(), 'resources', path)}.png`

	const image = await Bun.file(imagePath).arrayBuffer()

	const { width = 0 } = await sharp(image).metadata()
	const newWidth = Math.max(1, Math.round(width / ratio))

	const downscaled = await sharp(image)
		.resize({ width: newWidth })
		.png()
		.toBuffer()

	return downscaled as unknown as Buffer<ArrayBufferLike>
}

export function ImageDisplayModel(texture: TextureClass<'item'> | string) {
	const src = typeof texture === 'string' ? texture : texture.name

	const [ namespace, modelType, ...modelPath ] = src.split('/').flatMap((part: string, i: number) => {
		if (i === 0) {
			const colonI = part.indexOf(':')

			if (colonI !== -1) {
				return [part.slice(0, colonI), part.slice(colonI + 1)]
			}
			return [NAMESPACE, part]
		}
		return part
	})

	return ItemModelDefinition(modelPath.join('/'), {
		model: {
			type: 'minecraft:model',
			model: Model(modelType as 'item', modelPath.join('/'), {
				parent: 'minecraft:item/generated',
				textures: { layer0: `${namespace}:${modelType}/${modelPath.join('/')}` },
			})
		},
	})
}