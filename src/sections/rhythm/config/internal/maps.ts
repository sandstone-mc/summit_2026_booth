import { readFileSync, existsSync, copyFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { project } from '..'
import { PROJECT_ROOT } from '@shared'

export interface MapConfig {
	file: string
	name: string
}

const mapsJson = join(PROJECT_ROOT, 'maps/maps.json')
export const mapList: MapConfig[] = JSON.parse(readFileSync(mapsJson, 'utf-8')) as MapConfig[]

const structureDir = join(PROJECT_ROOT, 'resources/datapack/data', project.namespace, 'structure/maps')
mkdirSync(structureDir, { recursive: true })

for (const map of mapList) {
	const src = join(PROJECT_ROOT, 'maps', map.file)
	const safeName = map.file.replace(/\.\w+$/, '')
	const dest = join(structureDir, `${safeName}.nbt`)
	if (existsSync(src)) {
		copyFileSync(src, dest)
	} else {
		console.warn(`[maps] Map file not found: ${map.file}`)
	}
}

export const mapCount = mapList.length
export const mapNames = mapList.map(m => m.name)
export const mapSafeNames = mapList.map(m => m.file.replace(/\.\w+$/, ''))
