import { join } from 'path'
import { project } from '..'
import { PROJECT_ROOT, writeGenerated } from '@shared'

export interface MapConfig {
	file: string
	name: string
}

export const mapList: MapConfig[] = await Bun.file(join(PROJECT_ROOT, 'maps/maps.json')).json()

for (const map of mapList) {
	const src = Bun.file(join(PROJECT_ROOT, 'maps', map.file))
	const safeName = map.file.replace(/\.\w+$/, '')
	if (await src.exists()) {
		await writeGenerated('datapack', `data/${project.namespace}/structure/generated/maps/${safeName}.nbt`, src)
	} else {
		console.warn(`[maps] Map file not found: ${map.file}`)
	}
}

export const mapCount = mapList.length
export const mapNames = mapList.map(m => m.name)
export const mapSafeNames = mapList.map(m => m.file.replace(/\.\w+$/, ''))
