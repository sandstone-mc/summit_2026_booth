import { resolve } from 'path'
import { Tag } from 'sandstone'
import config from '../sandstone.config'

export const NAMESPACE = config.namespace!
export const PROJECT_ROOT = resolve(import.meta.dirname, '..')

export const BOOTH_ENTITY_TAG = `summit.booth_entity.${NAMESPACE}` as const

export const ticking = Tag('function', 'ticking', [])
