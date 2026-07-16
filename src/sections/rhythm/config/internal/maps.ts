import { join } from 'path'
import { type ItemModelDefinitionClass, RawResource } from 'sandstone'

import { NAMESPACE, PROJECT_ROOT } from '@shared'
import { skybox_neon, skybox_rainbows, skybox_void } from './shaders'

export interface MapConfig {
	structure: string
	name: string
	skybox: ItemModelDefinitionClass
}

const configuredMaps: MapConfig[] = [
  {
    structure: 'rhythm_sandstone_garden',
    name: 'Sandstone Garden',
    skybox: skybox_rainbows
  },
  {
    structure: 'rhythm_frostbound_garden',
    name: 'Frostbound Garden',
    skybox: skybox_neon
  },
  {
    structure: 'rhythm_crimson_garden',
    name: 'Crimson Ember',
    skybox: skybox_void
  }
]


export const mapList: MapConfig[] = []
for (const map of configuredMaps) {
	const src = Bun.file(join(PROJECT_ROOT, 'resources', 'data', 'showcase', `${map.structure}.nbt`))
	if (!(await src.exists())) {
		console.warn(`[maps] Map file not found, skipping: ${map.name}`)
		continue
	}
	RawResource(
		`${NAMESPACE}/structure/${map.structure}.nbt`,
		src.arrayBuffer() as unknown as Buffer<ArrayBufferLike>,
	)
	mapList.push(map)
}

export const mapCount = mapList.length
export const mapNames = mapList.map((m) => m.name)
