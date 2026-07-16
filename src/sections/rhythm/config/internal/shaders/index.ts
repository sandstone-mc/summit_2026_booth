import sharp from 'sharp'
import { Texture, Model, ItemModelDefinition } from 'sandstone'

import sdkConfig from './sdk.toml'

type RGBA = [number, number, number, number]

const id = sdkConfig.id as RGBA

type Pixel = [number, number, RGBA]

async function shaderTarget(extraPixels: Pixel[]) {
	const data = new Uint8Array(16 * 16 * 4)

	for (let i = 3; i < data.length; i += 4) data[i] = 255

	for (const [x, y, [r, g, b, a]] of extraPixels) {
		const i = (y * 16 + x) * 4
		data[i] = r
		data[i + 1] = g
		data[i + 2] = b
		data[i + 3] = a
	}

	return sharp(data, { raw: { width: 16, height: 16, channels: 4 } })
		.png()
		.toBuffer() as unknown as Buffer<ArrayBufferLike>
}

export const [skybox_rainbows, skybox_neon, skybox_void ] = [
	'rainbows', 'neon', 'void'
].map((variant, i) => ItemModelDefinition(`rhythm/skybox_${variant}`, {
	model: {
		type: 'minecraft:model',
		model: Model('item', `rhythm/skybox_${variant}`, {
			textures: {
				'0': Texture('item', `rhythm/skybox_${variant}`,
					shaderTarget([
						[0, 0, [1, 2, 3, 255]],
						[1, 0, id],
						[2, 0, [i, 0, 0, 255]]
					])
				),
			},
			elements: [{
				from: [0.001, -0.35875, 0.2867],
				to: [15.999, 14.99, 16.2847],
				faces: {
					north: { uv: [0.5, 0.5, 0.5, 0.5], texture: '#0' },
					east: { uv: [0.5, 0.5, 0.5, 0.5], texture: '#0' },
					west: { uv: [0.5, 0.5, 0.5, 0.5], texture: '#0' },
					down: { uv: [0.5, 0.5, 0.5, 0.0], texture: '#0' },
				},
			}],
		}),
	},
}))
