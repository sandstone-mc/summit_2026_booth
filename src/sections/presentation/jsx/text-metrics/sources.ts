// Font sources: where to load a font JSON / PNG from.
//
// - Default font: misode/mcmeta's `assets` branch, cached locally at
//   `.sandstone/cache/font/`. Network only happens on first build.
// - Custom font: local `resources/resourcepack/assets/<ns>/font/...`.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const CACHE_DIR = join(process.cwd(), '.sandstone', 'cache', 'font')
const RESOURCES_DIR = join(process.cwd(), 'resources', 'resourcepack', 'assets')

// misode/mcmeta's `assets` branch tracks MC's latest bundled resources.
const MCMETA_BASE = 'https://raw.githubusercontent.com/misode/mcmeta/assets/assets'

// Default font: load JSON + bitmaps from misode (network, cached).
export class DefaultFontSource {
	async fetchToCache(relPath: string): Promise<Buffer> {
		const cached = join(CACHE_DIR, relPath)
		if (existsSync(cached)) return readFileSync(cached)
		const url = `${MCMETA_BASE}/minecraft/${relPath}`
		const res = await fetch(url)
		if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`)
		const buf = Buffer.from(await res.arrayBuffer())
		mkdirSync(dirname(cached), { recursive: true })
		writeFileSync(cached, buf)
		return buf
	}
}

// Custom font: load JSON + bitmaps from the user's resourcepack dir.
export class LocalFontSource {
	// Resource location `minecraft:include/default` → local font JSON path.
	jsonPath(fontId: string): string {
		const [ns, ...rest] = fontId.split(':')
		if (!ns) throw new Error(`text-metrics: invalid font ID ${fontId}`)
		return join(RESOURCES_DIR, ns, 'font', `${rest.join(':')}.json`)
	}

	// Bitmap ref `minecraft:font/ascii.png` → local PNG path.
	bitmapPath(file: string): string {
		const [ns, ...rest] = file.split(':')
		if (!ns) throw new Error(`text-metrics: invalid bitmap file ref ${file}`)
		return join(RESOURCES_DIR, ns, 'textures', ...rest)
	}

	readJson(fontId: string): Buffer {
		const p = this.jsonPath(fontId)
		if (!existsSync(p)) {
			throw new Error(
				`text-metrics: custom font ${fontId} not found at ${p} — ` +
					`add it under resources/resourcepack/assets/<namespace>/font/`,
			)
		}
		return readFileSync(p)
	}

	readJsonIfExists(fontId: string): Buffer | null {
		const p = this.jsonPath(fontId)
		return existsSync(p) ? readFileSync(p) : null
	}

	readBitmap(file: string): Buffer {
		const p = this.bitmapPath(file)
		if (!existsSync(p)) {
			throw new Error(`text-metrics: font bitmap ${file} not found at ${p}`)
		}
		return readFileSync(p)
	}
}