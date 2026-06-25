import { Midi } from '@tonejs/midi'
import { mkdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import { NAMESPACE, PROJECT_ROOT } from '@shared'

const SOUNDFONT = '/usr/share/soundfonts/FluidR3_GM.sf2'
const CACHE_DIR = join(PROJECT_ROOT, '.cache/sounds')
const RESOURCE_SOUNDS_DIR = join(PROJECT_ROOT, `resources/resourcepack/assets/${NAMESPACE}/sounds/music`)
const RESOURCE_BASE = join(PROJECT_ROOT, `resources/resourcepack/assets/${NAMESPACE}`)

export const DURATION_BUCKETS = [0.1, 0.25, 0.5, 1.0, 1.5]

export function nearestDurationBucket(duration: number): number {
	let best = 0
	let bestDiff = Math.abs(duration - DURATION_BUCKETS[0])
	for (let i = 1; i < DURATION_BUCKETS.length; i++) {
		const diff = Math.abs(duration - DURATION_BUCKETS[i])
		if (diff < bestDiff) { best = i; bestDiff = diff }
	}
	return best
}

export interface SoundKey {
	program: number
	midiNote: number
	isPercussion: boolean
	durationBucket: number
}

export function getSoundId(key: SoundKey): string {
	const d = key.durationBucket
	if (key.isPercussion) return `${NAMESPACE}:music.perc_n${key.midiNote}_d${d}`
	return `${NAMESPACE}:music.p${key.program}_n${key.midiNote}_d${d}`
}

function getSoundName(key: SoundKey): string {
	const d = key.durationBucket
	if (key.isPercussion) return `perc_n${key.midiNote}_d${d}`
	return `p${key.program}_n${key.midiNote}_d${d}`
}

async function createSingleNoteMidi(key: SoundKey, outputPath: string): Promise<void> {
	const midi = new Midi()
	const track = midi.addTrack()
	if (key.isPercussion) {
		track.channel = 9
	} else {
		track.channel = 0
		track.instrument.number = key.program
	}
	track.addNote({
		midi: key.midiNote,
		time: 0,
		duration: DURATION_BUCKETS[key.durationBucket],
		velocity: 0.9,
	})
	await Bun.write(outputPath, Buffer.from(midi.toArray()))
}

async function renderSound(key: SoundKey): Promise<void> {
	const name = getSoundName(key)
	const oggPath = join(CACHE_DIR, `${name}.ogg`)
	if (await Bun.file(oggPath).exists()) return

	const midPath = join(CACHE_DIR, `${name}.mid`)
	const wavPath = join(CACHE_DIR, `${name}.wav`)

	await createSingleNoteMidi(key, midPath)

	const fluidResult = Bun.spawnSync(['fluidsynth',
		'-ni', '-g', '0.8', '-r', '44100',
		'-F', wavPath, SOUNDFONT, midPath,
	])
	if (!fluidResult.success) {
		console.error(`[render-sounds] fluidsynth failed for ${name}:`, fluidResult.stderr.toString())
		return
	}

	const ffmpegResult = Bun.spawnSync(['ffmpeg',
		'-y', '-i', wavPath,
		'-c:a', 'libvorbis', '-q:a', '6',
		'-af', 'silenceremove=stop_periods=-1:stop_duration=0.02:stop_threshold=-55dB',
		oggPath,
	])
	if (!ffmpegResult.success) {
		console.error(`[render-sounds] ffmpeg failed for ${name}:`, ffmpegResult.stderr.toString())
		return
	}

	try { unlinkSync(midPath) } catch {}
	try { unlinkSync(wavPath) } catch {}
}

export async function renderAllSounds(keys: SoundKey[]): Promise<void> {
	if (keys.length === 0) return
	mkdirSync(CACHE_DIR, { recursive: true })
	mkdirSync(RESOURCE_SOUNDS_DIR, { recursive: true })

	const keyMap = new Map<string, SoundKey>()
	for (const key of keys) {
		const id = getSoundName(key)
		if (!keyMap.has(id)) keyMap.set(id, key)
	}
	const uniqueKeys = Array.from(keyMap.values())
	console.log(`[render-sounds] Rendering ${uniqueKeys.length} unique sounds...`)

	let rendered = 0
	for (const key of uniqueKeys) {
		const name = getSoundName(key)
		const cachedOgg = join(CACHE_DIR, `${name}.ogg`)
		const wasCached = await Bun.file(cachedOgg).exists()
		await renderSound(key)
		if (!wasCached) rendered++
		if (await Bun.file(cachedOgg).exists()) await Bun.write(join(RESOURCE_SOUNDS_DIR, `${name}.ogg`), Bun.file(cachedOgg))
	}

	if (rendered > 0) console.log(`[render-sounds] Rendered ${rendered} new sounds (${uniqueKeys.length - rendered} cached)`)
	else console.log(`[render-sounds] All ${uniqueKeys.length} sounds from cache`)

	const soundsJson: Record<string, { sounds: { name: string; stream: boolean }[] }> = {}
	for (const key of uniqueKeys) {
		const name = getSoundName(key)
		const eventName = getSoundId(key).replace(`${NAMESPACE}:`, '')
		soundsJson[eventName] = { sounds: [{ name: `${NAMESPACE}:music/${name}`, stream: false }] }
	}
	await Bun.write(join(RESOURCE_BASE, 'sounds.json'), JSON.stringify(soundsJson, null, 2))
	console.log(`[render-sounds] Written sounds.json with ${uniqueKeys.length} entries`)
}

const SONGS_FULL_DIR = join(RESOURCE_SOUNDS_DIR, 'songs')
const SONGS_CACHE_DIR = join(CACHE_DIR, 'songs')

export const SEGMENT_SECS = 10
export const SEGMENT_TICKS = SEGMENT_SECS * 20

export interface FullSongInfo {
	safeName: string
	segmentCount: number
	audioOffsetTicks: number
}

export function getSegmentSoundId(safeName: string, segmentIdx: number): `${string}:${string}` {
	return `${NAMESPACE}:music.song_${safeName}_s${segmentIdx}`
}

function getAudioDuration(filePath: string): number {
	const result = Bun.spawnSync(['ffprobe',
		'-v', 'error', '-show_entries', 'format=duration',
		'-of', 'csv=p=0', filePath,
	])
	return parseFloat(result.stdout.toString().trim() || '0')
}

function detectAudioStart(filePath: string): number {
	const result = Bun.spawnSync(['ffmpeg',
		'-i', filePath,
		'-af', 'silencedetect=noise=-30dB:d=0.05',
		'-f', 'null', '-',
	])
	const stderr = result.stderr.toString()
	const match = stderr.match(/silence_end:\s*([\d.]+)/)
	return match ? parseFloat(match[1]) : 0
}

function detectMidiAudioStart(midiPath: string): number {
	const tmpWav = join(SONGS_CACHE_DIR, '_onset_tmp.wav')
	const fluidResult = Bun.spawnSync(['fluidsynth',
		'-ni', '-g', '0.8', '-r', '44100',
		'-F', tmpWav, SOUNDFONT, midiPath,
	])
	if (!fluidResult.success) return 0
	const start = detectAudioStart(tmpWav)
	try { unlinkSync(tmpWav) } catch {}
	return start
}

export interface SongRenderInput {
	midiPath: string
	safeName: string
	audioPath?: string
	audioStart?: number
	audioOffset?: number
}

export async function renderFullSongs(songs: SongRenderInput[]): Promise<FullSongInfo[]> {
	if (songs.length === 0) return []
	mkdirSync(SONGS_FULL_DIR, { recursive: true })
	mkdirSync(SONGS_CACHE_DIR, { recursive: true })

	console.log(`[render-songs] Rendering ${songs.length} songs as ${SEGMENT_SECS}s segments...`)
	const results: FullSongInfo[] = []
	let totalSegments = 0
	let rendered = 0

	for (const song of songs) {
		const wavPath = join(SONGS_CACHE_DIR, `${song.safeName}.wav`)
		const segMarker = join(SONGS_CACHE_DIR, `${song.safeName}.segments`)

		let audioOffsetSec = song.audioOffset ?? 0

		if (song.audioPath && await Bun.file(song.audioPath).exists() && song.audioOffset === undefined) {
			const midiStart = detectMidiAudioStart(song.midiPath)
			const audioStartTrim = song.audioStart ?? 0
			const rawAudioOnset = detectAudioStart(song.audioPath)
			const audioOnset = Math.max(0, rawAudioOnset - audioStartTrim)
			audioOffsetSec = midiStart - audioOnset
			console.log(`[render-songs] Auto-offset for ${song.safeName}: ${audioOffsetSec.toFixed(3)}s`)
		}
		const audioOffsetTicks = Math.round(audioOffsetSec * 20)

		if (!await Bun.file(wavPath).exists() && !await Bun.file(segMarker).exists()) {
			if (song.audioPath && await Bun.file(song.audioPath).exists()) {
				const trimArgs = song.audioStart ? ['-ss', `${song.audioStart}`] : []
				const ffmpegResult = Bun.spawnSync(['ffmpeg',
					'-y', ...trimArgs, '-i', song.audioPath,
					'-ar', '44100', '-ac', '2', wavPath,
				])
				if (!ffmpegResult.success) {
					console.error(`[render-songs] ffmpeg convert failed for ${song.safeName}`)
					results.push({ safeName: song.safeName, segmentCount: 0, audioOffsetTicks })
					continue
				}
			} else {
				const fluidResult = Bun.spawnSync(['fluidsynth',
					'-ni', '-g', '0.8', '-r', '44100',
					'-F', wavPath, SOUNDFONT, song.midiPath,
				])
				if (!fluidResult.success) {
					console.error(`[render-songs] fluidsynth failed for ${song.safeName}`)
					results.push({ safeName: song.safeName, segmentCount: 0, audioOffsetTicks })
					continue
				}
			}
		}

		let segmentCount: number
		if (await Bun.file(segMarker).exists()) {
			segmentCount = parseInt(await Bun.file(segMarker).text())
		} else {
			const duration = getAudioDuration(wavPath)
			segmentCount = Math.ceil(duration / SEGMENT_SECS)
			for (let i = 0; i < segmentCount; i++) {
				const segOgg = join(SONGS_CACHE_DIR, `${song.safeName}_s${i}.ogg`)
				if (!await Bun.file(segOgg).exists()) {
					const startSec = i * SEGMENT_SECS
					const ffmpegResult = Bun.spawnSync(['ffmpeg',
						'-y', '-ss', `${startSec}`, '-t', `${SEGMENT_SECS}`,
						'-i', wavPath,
						'-c:a', 'libvorbis', '-q:a', '5', '-ac', '2', segOgg,
					])
					if (ffmpegResult.success) rendered++
				}
			}
			await Bun.write(segMarker, `${segmentCount}`)
			try { unlinkSync(wavPath) } catch {}
		}

		for (let i = 0; i < segmentCount; i++) {
			const segOgg = join(SONGS_CACHE_DIR, `${song.safeName}_s${i}.ogg`)
			const segDest = join(SONGS_FULL_DIR, `${song.safeName}_s${i}.ogg`)
			if (await Bun.file(segOgg).exists()) await Bun.write(segDest, Bun.file(segOgg))
		}

		results.push({ safeName: song.safeName, segmentCount, audioOffsetTicks })
		totalSegments += segmentCount
	}

	if (rendered > 0) console.log(`[render-songs] Rendered ${rendered} new segments (${totalSegments} total)`)
	else console.log(`[render-songs] All ${totalSegments} segments from cache`)

	const soundsJsonPath = join(RESOURCE_BASE, 'sounds.json')
	let soundsJson: Record<string, any> = {}
	if (await Bun.file(soundsJsonPath).exists()) soundsJson = JSON.parse(await Bun.file(soundsJsonPath).text())

	for (const info of results) {
		for (let i = 0; i < info.segmentCount; i++) {
			const eventName = `music.song_${info.safeName}_s${i}`
			soundsJson[eventName] = { sounds: [{ name: `${NAMESPACE}:music/songs/${info.safeName}_s${i}`, stream: true }] }
		}
	}

	await Bun.write(soundsJsonPath, JSON.stringify(soundsJson, null, 2))
	return results
}
