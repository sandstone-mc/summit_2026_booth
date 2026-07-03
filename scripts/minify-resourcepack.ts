import { join } from 'path'

const outputDir = join(import.meta.dirname, '../.sandstone/output/resourcepack')

const glob = new Bun.Glob('**/*.json')
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
