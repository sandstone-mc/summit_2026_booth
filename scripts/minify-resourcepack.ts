import { join } from 'path'

const outputDir = join(import.meta.dirname, '../.sandstone/output/resourcepack')

const glob = new Bun.Glob('**/*.{json,mcmeta}')
let minified = 0

for await (const path of glob.scan(outputDir)) {
	const fullPath = join(outputDir, path)
	const raw = await Bun.file(fullPath).text()
	const compact = JSON.stringify(JSON.parse(raw))
	if (compact.length < raw.length) {
		await Bun.write(fullPath, compact)
		minified++
	}
}

if (minified > 0) console.log(`[minify] Compacted ${minified} JSON files in resourcepack`)

// optional: recompress textures when optipng is available (biggest win for the zipped pack size)
const pngGlob = new Bun.Glob('**/*.png')
const pngs: string[] = []
for await (const path of pngGlob.scan(outputDir)) pngs.push(join(outputDir, path))
if (pngs.length > 0) {
	const probe = Bun.spawnSync(['optipng', '--version'])
	if (probe.success) {
		Bun.spawnSync(['optipng', '-o5', '-quiet', ...pngs])
		console.log(`[minify] Optimized ${pngs.length} PNGs`)
	}
}
