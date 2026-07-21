import { join } from 'path'
import sharp from 'sharp'

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