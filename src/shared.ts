import { resolve } from 'path'
import { Objective, Tag } from 'sandstone'
import config from '../sandstone.config'

export const NAMESPACE = config.namespace!
export const PROJECT_ROOT = resolve(import.meta.dirname, '..')
export const DIM = 'minecraft:overworld' as const

export const ticking = Tag('function', 'ticking', [])

export const Positions: Record<string, [number, number, number]> = {
	BOOTH_RETURN: [2, 65, -12],
}

export const state = Objective.create('rhythm.state', 'dummy')