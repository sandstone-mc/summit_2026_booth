import { join } from 'path'

import { RawResource } from 'sandstone'
import { NAMESPACE, PROJECT_ROOT } from '@shared'

export interface MapConfig {
	file: string
	name: string
	/** item model id of the skybox shown with this map (without namespace) */
	skybox: string
}

const configuredMaps: MapConfig[] = await Bun.file(join(PROJECT_ROOT, 'maps/maps.json')).json()

export const mapList: MapConfig[] = []
for (const map of configuredMaps) {
	const src = Bun.file(join(PROJECT_ROOT, 'maps', map.file))
	if (!(await src.exists())) {
		console.warn(`[maps] Map file not found, skipping: ${map.file}`)
		continue
	}
	const safeName = map.file.replace(/\.\w+$/, '')
	RawResource(
		`${NAMESPACE}/structure/generated/maps/${safeName}.nbt`,
		src.arrayBuffer().then((buf) => Buffer.from(buf)),
	)
	mapList.push(map)
}

export const mapCount = mapList.length
export const mapNames = mapList.map((m) => m.name)
export const mapSafeNames = mapList.map((m) => m.file.replace(/\.\w+$/, ''))
