const REQUIRED_TOOLS = [
	{ bin: 'ffmpeg', env: 'FFMPEG_PATH' },
	{ bin: 'ffprobe', env: 'FFPROBE_PATH' },
	{ bin: 'optipng', env: 'OPTIPNG_PATH' },
]

const missingTools = REQUIRED_TOOLS.filter(({ bin, env }) => !Bun.which(process.env[env] ?? bin))
if (missingTools.length > 0) {
	const message = `Missing required tools: ${missingTools.map(({ bin, env }) => `${bin} (install it or set ${env})`).join(', ')}`
	console.error(message)
	throw new Error(message)
}
