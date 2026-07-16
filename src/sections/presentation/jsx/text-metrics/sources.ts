// Font sources: where to load a font JSON / PNG from.
//
// - Default font: misode/mcmeta's `assets` branch, cached locally at
//   `.sandstone/cache/font/`. Network only happens on first build.
// - Custom font: local `resources/assets/font/...` (sibling of `assets/`
//   the resourcepack pulls textures from at build time).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const CACHE_DIR = join(process.cwd(), '.sandstone', 'cache', 'font')
const ASSETS_FONT_DIR = join(process.cwd(), 'resources', 'assets', 'font')

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

// Custom font: load JSON + bitmaps from `resources/assets/font/`.
export class LocalFontSource {
	// Resource location `<ns>:<name>` → local JSON path. Each font is a
	// subdir of `resources/assets/font/<name>/providers.json`.
	jsonPath(fontId: string): string {
		const [, ...rest] = fontId.split(':')
		if (!rest.length) throw new Error(`text-metrics: invalid font ID ${fontId}`)
		return join(ASSETS_FONT_DIR, rest.join(':'), 'providers.json')
	}

	// Bitmap ref `<ns>:font/<path>` → local PNG path. The leading `font/`
	// is dropped — files live directly under `resources/assets/font/`.
	bitmapPath(file: string): string {
		const [, ...rest] = file.split(':')
		if (!rest.length) throw new Error(`text-metrics: invalid bitmap file ref ${file}`)
		const tail = rest.join('/').replace(/^font\//, '')
		return join(ASSETS_FONT_DIR, tail)
	}

	readJson(fontId: string): Buffer {
		const p = this.jsonPath(fontId)
		if (!existsSync(p)) {
			throw new Error(
				`text-metrics: custom font ${fontId} not found at ${p} — ` +
					`add it under resources/assets/font/<name>/providers.json`,
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