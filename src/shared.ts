import { resolve } from 'path'
import { Tag } from 'sandstone'
import config from '../sandstone.config'

export const NAMESPACE = config.namespace!
export const PROJECT_ROOT = resolve(import.meta.dirname, '..')

export const ticking = Tag('function', 'ticking', [])
