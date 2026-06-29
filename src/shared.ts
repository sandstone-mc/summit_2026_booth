import { resolve, join, dirname } from 'path'
import { mkdirSync } from 'fs'
import { Objective, Tag } from 'sandstone'
import { project, boothReturn } from '@rhythm/config/internal/derived'

export const NAMESPACE = project.namespace
export const DIMENSION = project.dimension
export const PROJECT_ROOT = resolve(import.meta.dirname, '..')

export async function writeGenerated(type: 'resourcepack' | 'datapack', relativePath: string, content: string | Buffer | Blob) {
	const resPath = join(PROJECT_ROOT, 'resources', type, relativePath)
	mkdirSync(dirname(resPath), { recursive: true })
	await Bun.write(resPath, content)
}

export const ticking = Tag('function', 'ticking', [])

export const Positions = {
	BOOTH_RETURN: boothReturn,
} as const

export const state = Objective.create('rhythm.state', 'dummy')
