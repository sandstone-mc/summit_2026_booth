import { dirname, join, resolve } from 'path'
import { Objective, Tag } from 'sandstone'
import config from '../sandstone.config.ts'
import { mkdirSync } from 'fs';

export const ticking = Tag('function', 'ticking', [])

export const NAMESPACE = config.namespace!
export const PROJECT_ROOT = resolve(import.meta.dirname, '..')
export const DIMENSION = 'minecraft:overworld' as const

export const Positions: Record<string, [number, number, number]> = {
	BOOTH_RETURN: [-118, 72, -30],
	BTN_CYCLE: [-120, 73, -30],
	BTN_START: [-116, 73, -30],
	BTN_CYCLE_DISPLAY: [-120, 74.5, -30],
	BTN_START_DISPLAY: [-116, 74.5, -30],
}

export const state = Objective.create('rhythm.state', 'dummy')

export async function writeGenerated(type: 'resourcepack' | 'datapack', relativePath: string, content: string | Buffer | Blob) {
	const resPath = join(PROJECT_ROOT, 'resources', type, relativePath)
	mkdirSync(dirname(resPath), { recursive: true })
	await Bun.write(resPath, content)
}