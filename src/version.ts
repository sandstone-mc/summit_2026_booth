import { createHash } from 'crypto'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'node:path'
import { MCFunction, raw } from 'sandstone'
import { PROJECT_ROOT, NAMESPACE } from './shared'

function computePackHash(): string {
	const hash = createHash('sha256')

	function walkDir(dir: string) {
		if (!existsSync(dir)) return
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const full = join(dir, entry.name)
			if (entry.isDirectory()) walkDir(full)
			else hash.update(readFileSync(full))
		}
	}

	walkDir(join(PROJECT_ROOT, 'src'))

	for (const songsJson of [
		join(PROJECT_ROOT, 'resources/assets/songs/public/songs.json'),
		join(PROJECT_ROOT, 'resources/assets/songs/private/songs.json'),
	]) {
		if (existsSync(songsJson)) hash.update(readFileSync(songsJson))
	}

	return hash.digest('hex').slice(0, 12)
}

const PACK_HASH = computePackHash()
const STORAGE = `${NAMESPACE}:meta`

MCFunction('version_check', () => {
	raw(`execute unless data storage ${STORAGE} {hash:"${PACK_HASH}"} run tellraw @a [{"text":"[Summit Booth] ","color":"gold"},{"text":"Datapack updated ","color":"green"},{"text":"(${PACK_HASH})","color":"gray"}]`)
	raw(`execute if data storage ${STORAGE} {hash:"${PACK_HASH}"} run tellraw @a [{"text":"[Summit Booth] ","color":"gold"},{"text":"Datapack reloaded","color":"aqua"}]`)
	raw(`data modify storage ${STORAGE} hash set value "${PACK_HASH}"`)
}, { runOnLoad: true })
