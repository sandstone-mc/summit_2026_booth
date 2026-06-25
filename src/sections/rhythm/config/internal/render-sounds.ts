import { Midi } from '@tonejs/midi'
import { mkdirSync, existsSync, copyFileSync, writeFileSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { spawnSync } from 'child_process'
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

function createSingleNoteMidi(key: SoundKey, outputPath: string): void {
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
	writeFileSync(outputPath, Buffer.from(midi.toArray()))
}

function renderSound(key: SoundKey): void {
	const name = getSoundName(key)
	const oggPath = join(CACHE_DIR, `${name}.ogg`)
	if (existsSync(oggPath)) return

	const midPath = join(CACHE_DIR, `${name}.mid`)
	const wavPath = join(CACHE_DIR, `${name}.wav`)

	createSingleNoteMidi(key, midPath)

	const fluidResult = spawnSync('fluidsynth', [
		'-ni', '-g', '0.8', '-r', '44100',
		'-F', wavPath, SOUNDFONT, midPath,
	], { timeout: 30000 })
	if (fluidResult.status !== 0) {
		console.error(`[render-sounds] fluidsynth failed for ${name}:`, fluidResult.stderr?.toString())
		return
	}

	const ffmpegResult = spawnSync('ffmpeg', [
		'-y', '-i', wavPath,
		'-c:a', 'libvorbis', '-q:a', '6',
		'-af', 'silenceremove=stop_periods=-1:stop_duration=0.02:stop_threshold=-55dB',
		oggPath,
	], { timeout: 30000 })
	if (ffmpegResult.status !== 0) {
		console.error(`[render-sounds] ffmpeg failed for ${name}:`, ffmpegResult.stderr?.toString())
		return
	}

	try { unlinkSync(midPath) } catch {}
	try { unlinkSync(wavPath) } catch {}
}

export function renderAllSounds(keys: SoundKey[]): void {
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
		const wasCached = existsSync(cachedOgg)
		renderSound(key)
		if (!wasCached) rendered++
		if (existsSync(cachedOgg)) copyFileSync(cachedOgg, join(RESOURCE_SOUNDS_DIR, `${name}.ogg`))
	}

	if (rendered > 0) console.log(`[render-sounds] Rendered ${rendered} new sounds (${uniqueKeys.length - rendered} cached)`)
	else console.log(`[render-sounds] All ${uniqueKeys.length} sounds from cache`)

	const soundsJson: Record<string, { sounds: { name: string; stream: boolean }[] }> = {}
	for (const key of uniqueKeys) {
		const name = getSoundName(key)
		const eventName = getSoundId(key).replace(`${NAMESPACE}:`, '')
		soundsJson[eventName] = { sounds: [{ name: `${NAMESPACE}:music/${name}`, stream: false }] }
	}
	writeFileSync(join(RESOURCE_BASE, 'sounds.json'), JSON.stringify(soundsJson, null, 2))
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
	const result = spawnSync('ffprobe', [
		'-v', 'error', '-show_entries', 'format=duration',
		'-of', 'csv=p=0', filePath,
	], { timeout: 10000 })
	return parseFloat(result.stdout?.toString().trim() || '0')
}

function detectAudioStart(filePath: string): number {
	const result = spawnSync('ffmpeg', [
		'-i', filePath,
		'-af', 'silencedetect=noise=-30dB:d=0.05',
		'-f', 'null', '-',
	], { timeout: 30000 })
	const stderr = result.stderr?.toString() || ''
	const match = stderr.match(/silence_end:\s*([\d.]+)/)
	return match ? parseFloat(match[1]) : 0
}

function detectMidiAudioStart(midiPath: string): number {
	const tmpWav = join(SONGS_CACHE_DIR, '_onset_tmp.wav')
	const fluidResult = spawnSync('fluidsynth', [
		'-ni', '-g', '0.8', '-r', '44100',
		'-F', tmpWav, SOUNDFONT, midiPath,
	], { timeout: 60000 })
	if (fluidResult.status !== 0) return 0
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

export function renderFullSongs(songs: SongRenderInput[]): FullSongInfo[] {
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

		if (song.audioPath && existsSync(song.audioPath) && song.audioOffset === undefined) {
			const midiStart = detectMidiAudioStart(song.midiPath)
			const audioStartTrim = song.audioStart ?? 0
			const rawAudioOnset = detectAudioStart(song.audioPath)
			const audioOnset = Math.max(0, rawAudioOnset - audioStartTrim)
			audioOffsetSec = midiStart - audioOnset
			console.log(`[render-songs] Auto-offset for ${song.safeName}: ${audioOffsetSec.toFixed(3)}s`)
		}
		const audioOffsetTicks = Math.round(audioOffsetSec * 20)

		if (!existsSync(wavPath) && !existsSync(segMarker)) {
			if (song.audioPath && existsSync(song.audioPath)) {
				const trimArgs = song.audioStart ? ['-ss', `${song.audioStart}`] : []
				const ffmpegResult = spawnSync('ffmpeg', [
					'-y', ...trimArgs, '-i', song.audioPath,
					'-ar', '44100', '-ac', '2', wavPath,
				], { timeout: 120000 })
				if (ffmpegResult.status !== 0) {
					console.error(`[render-songs] ffmpeg convert failed for ${song.safeName}`)
					results.push({ safeName: song.safeName, segmentCount: 0, audioOffsetTicks })
					continue
				}
			} else {
				const fluidResult = spawnSync('fluidsynth', [
					'-ni', '-g', '0.8', '-r', '44100',
					'-F', wavPath, SOUNDFONT, song.midiPath,
				], { timeout: 120000 })
				if (fluidResult.status !== 0) {
					console.error(`[render-songs] fluidsynth failed for ${song.safeName}`)
					results.push({ safeName: song.safeName, segmentCount: 0, audioOffsetTicks })
					continue
				}
			}
		}

		let segmentCount: number
		if (existsSync(segMarker)) {
			segmentCount = parseInt(readFileSync(segMarker, 'utf-8').trim())
		} else {
			const duration = getAudioDuration(wavPath)
			segmentCount = Math.ceil(duration / SEGMENT_SECS)
			for (let i = 0; i < segmentCount; i++) {
				const segOgg = join(SONGS_CACHE_DIR, `${song.safeName}_s${i}.ogg`)
				if (!existsSync(segOgg)) {
					const startSec = i * SEGMENT_SECS
					const ffmpegResult = spawnSync('ffmpeg', [
						'-y', '-ss', `${startSec}`, '-t', `${SEGMENT_SECS}`,
						'-i', wavPath,
						'-c:a', 'libvorbis', '-q:a', '5', '-ac', '2', segOgg,
					], { timeout: 30000 })
					if (ffmpegResult.status === 0) rendered++
				}
			}
			writeFileSync(segMarker, `${segmentCount}`)
			try { unlinkSync(wavPath) } catch {}
		}

		for (let i = 0; i < segmentCount; i++) {
			const segOgg = join(SONGS_CACHE_DIR, `${song.safeName}_s${i}.ogg`)
			const segDest = join(SONGS_FULL_DIR, `${song.safeName}_s${i}.ogg`)
			if (existsSync(segOgg)) copyFileSync(segOgg, segDest)
		}

		results.push({ safeName: song.safeName, segmentCount, audioOffsetTicks })
		totalSegments += segmentCount
	}

	if (rendered > 0) console.log(`[render-songs] Rendered ${rendered} new segments (${totalSegments} total)`)
	else console.log(`[render-songs] All ${totalSegments} segments from cache`)

	const soundsJsonPath = join(RESOURCE_BASE, 'sounds.json')
	let soundsJson: Record<string, any> = {}
	if (existsSync(soundsJsonPath)) soundsJson = JSON.parse(readFileSync(soundsJsonPath, 'utf-8'))

	for (const info of results) {
		for (let i = 0; i < info.segmentCount; i++) {
			const eventName = `music.song_${info.safeName}_s${i}`
			soundsJson[eventName] = { sounds: [{ name: `${NAMESPACE}:music/songs/${info.safeName}_s${i}`, stream: true }] }
		}
	}

	writeFileSync(soundsJsonPath, JSON.stringify(soundsJson, null, 2))
	return results
}
