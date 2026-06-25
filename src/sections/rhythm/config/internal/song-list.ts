import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { PROJECT_ROOT } from '@shared'

export interface SongConfig {
	file: string
	name: string
	difficulty: number
	audio?: string
	audioStart?: number
	audioOffset?: number
}

const SONGS_DIRS = [
	join(PROJECT_ROOT, 'songs/public'),
	join(PROJECT_ROOT, 'songs/private'),
]

export const songList: SongConfig[] = SONGS_DIRS.flatMap(dir => {
	const jsonPath = join(dir, 'songs.json')
	if (!existsSync(jsonPath)) return []
	return JSON.parse(readFileSync(jsonPath, 'utf-8')) as SongConfig[]
})
