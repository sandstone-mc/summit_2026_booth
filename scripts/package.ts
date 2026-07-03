import { join } from 'path'
import { mkdirSync, unlinkSync } from 'fs'

const root = join(import.meta.dirname, '..')
const outputDir = join(root, '.sandstone/output')
const distDir = join(root, 'dist')

mkdirSync(distDir, { recursive: true })

function zipDirectory(sourceDir: string, outPath: string, excludes: string[] = []) {
	try { unlinkSync(outPath) } catch {}
	const excludeArgs = excludes.flatMap(e => ['-x', e])
	const result = Bun.spawnSync(
		['zip', '-r', '--symlinks', outPath, '.', ...excludeArgs],
		{ cwd: sourceDir }
	)
	if (!result.success) {
		console.error(`[package] zip failed:`, result.stderr.toString())
		process.exit(1)
	}
}

const dpPath = join(distDir, 'sandstone_summit_booth-datapack.zip')
const rpPath = join(distDir, 'sandstone_summit_booth-resourcepack.zip')

console.log('[package] Zipping datapack...')
zipDirectory(join(outputDir, 'datapack'), dpPath, ['./datapack'])

console.log('[package] Zipping resourcepack...')
zipDirectory(join(outputDir, 'resourcepack'), rpPath, ['./resourcepack'])

const dpSize = Bun.file(dpPath).size
const rpSize = Bun.file(rpPath).size
console.log(`[package] dist/sandstone_summit_booth-datapack.zip (${(dpSize / 1024).toFixed(0)} KB)`)
console.log(`[package] dist/sandstone_summit_booth-resourcepack.zip (${(rpSize / 1024).toFixed(0)} KB)`)
