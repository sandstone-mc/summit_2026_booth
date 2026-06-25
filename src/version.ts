import { join } from 'path'
import { MCFunction, raw } from 'sandstone'
import { PROJECT_ROOT, NAMESPACE } from './shared'

async function computePackHash(): Promise<string> {
	const hasher = new Bun.CryptoHasher('sha256')
	const glob = new Bun.Glob('**/*')

	for (const path of glob.scanSync(join(PROJECT_ROOT, 'src'))) {
		hasher.update(await Bun.file(join(PROJECT_ROOT, 'src', path)).bytes())
	}

	for (const songsJson of [
		join(PROJECT_ROOT, 'songs/public/songs.json'),
		join(PROJECT_ROOT, 'songs/private/songs.json'),
	]) {
		const file = Bun.file(songsJson)
		if (await file.exists()) hasher.update(await file.bytes())
	}

	return hasher.digest('hex').slice(0, 12)
}

const PACK_HASH = await computePackHash()
const STORAGE = `${NAMESPACE}:meta`

MCFunction('version_check', () => {
	raw(`execute unless data storage ${STORAGE} {hash:"${PACK_HASH}"} run tellraw @a [{"text":"[Summit Booth] ","color":"gold"},{"text":"Datapack updated ","color":"green"},{"text":"(${PACK_HASH})","color":"gray"}]`)
	raw(`execute if data storage ${STORAGE} {hash:"${PACK_HASH}"} run tellraw @a [{"text":"[Summit Booth] ","color":"gold"},{"text":"Datapack reloaded","color":"aqua"}]`)
	raw(`data modify storage ${STORAGE} hash set value "${PACK_HASH}"`)
}, { runOnLoad: true })
