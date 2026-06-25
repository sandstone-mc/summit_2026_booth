import { mkdirSync } from 'fs'
import { join } from 'path'
import { project } from '..'
import { PROJECT_ROOT } from '@shared'

export interface MapConfig {
	file: string
	name: string
}

export const mapList: MapConfig[] = await Bun.file(join(PROJECT_ROOT, 'maps/maps.json')).json()

const structureDir = join(PROJECT_ROOT, 'resources/datapack/data', project.namespace, 'structure/maps')
mkdirSync(structureDir, { recursive: true })

for (const map of mapList) {
	const src = Bun.file(join(PROJECT_ROOT, 'maps', map.file))
	const safeName = map.file.replace(/\.\w+$/, '')
	const dest = join(structureDir, `${safeName}.nbt`)
	if (await src.exists()) {
		await Bun.write(dest, src)
	} else {
		console.warn(`[maps] Map file not found: ${map.file}`)
	}
}

export const mapCount = mapList.length
export const mapNames = mapList.map(m => m.name)
export const mapSafeNames = mapList.map(m => m.file.replace(/\.\w+$/, ''))
