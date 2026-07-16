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
	join(PROJECT_ROOT, 'resources/assets/songs/public'),
	join(PROJECT_ROOT, 'resources/assets/songs/private'),
]

export async function findSongFile(filename: string): Promise<string | undefined> {
	for (const dir of SONGS_DIRS) {
		const path = join(dir, filename)
		if (await Bun.file(path).exists()) return path
	}
	return undefined
}

export const songList: SongConfig[] = (
	await Promise.all(
		SONGS_DIRS.map(async (dir) => {
			const file = Bun.file(join(dir, 'songs.json'))
			if (!(await file.exists())) return []
			return (await file.json()) as SongConfig[]
		}),
	)
).flat()
