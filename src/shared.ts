import { resolve } from 'path'
import { Tag } from 'sandstone'
import config from '../sandstone.config'

export const NAMESPACE = config.namespace!
export const PROJECT_ROOT = resolve(import.meta.dirname, '..')
export const DIM = `${NAMESPACE}:rhythm` as const

export const ticking = Tag('function', 'ticking', [])

export const Positions: Record<string, [number, number, number]> = {
	BOOTH_RETURN: [-118, 72, -30],
	BTN_CYCLE: [-120, 73, -30],
	BTN_START: [-116, 73, -30],
	BTN_CYCLE_DISPLAY: [-120, 74.5, -30],
	BTN_START_DISPLAY: [-116, 74.5, -30],
}
