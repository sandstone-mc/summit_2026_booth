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

const pngGlob = new Bun.Glob('**/*.png')
const pngs: string[] = []
for await (const path of pngGlob.scan(outputDir)) pngs.push(join(outputDir, path))
if (pngs.length > 0) {
	const optipng = process.env.OPTIPNG_PATH ?? 'optipng'
	if (!Bun.which(optipng)) {
		console.error('[minify] optipng not found (install it or set OPTIPNG_PATH)')
		process.exit(1)
	}
	const result = Bun.spawnSync([optipng, '-o5', '-quiet', ...pngs])
	if (!result.success) {
		console.error('[minify] optipng failed:', result.stderr.toString())
		process.exit(1)
	}
	console.log(`[minify] Optimized ${pngs.length} PNGs`)
}
