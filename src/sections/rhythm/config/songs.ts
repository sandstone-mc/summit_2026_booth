import { Midi } from '@tonejs/midi'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { WALL_TRAVEL_OFFSET, WALL_SPEED } from './obstacle-pool'
import { PARKOUR_STEP_COUNT, parkourStepIntervalForSpeed } from './parkour-paths'
import { getSoundId, getSegmentSoundId, nearestDurationBucket, renderAllSounds, renderFullSongs, SEGMENT_SECS, SEGMENT_TICKS, type SoundKey, type FullSongInfo } from './render-sounds'
import { songList } from './song-list'
import { PROJECT_ROOT } from '../../../shared'

export interface SongNote {
	tick: number
	sound: string
}

export interface SongChart {
	beatTicks: number[]
	parkourStepTicks: number[][]
	durationTicks: number
}

export interface SongData {
	name: string
	difficulty: number
	notes: SongNote[]
	chart: SongChart
}

const SONGS_DIR = join(PROJECT_ROOT, 'songs')

const allSoundKeys: SoundKey[] = []

function parseMidi(filePath: string, displayName: string, difficulty: number, hasAudio: boolean): SongData {
	const midiData = readFileSync(filePath)
	const midi = new Midi(midiData)
	const notes: SongNote[] = []

	for (const track of midi.tracks) {
		const channel = track.channel
		const program = track.instrument?.number ?? 0
		for (const note of track.notes) {
			const gameTick = Math.round(note.time * 20)
			const isPercussion = channel === 9
			const key: SoundKey = {
				program: isPercussion ? 0 : program,
				midiNote: note.midi,
				isPercussion,
				durationBucket: nearestDurationBucket(note.duration),
			}
			if (!hasAudio) allSoundKeys.push(key)
			notes.push({ tick: gameTick, sound: hasAudio ? '' : getSoundId(key) })
		}
	}

	notes.sort((a, b) => a.tick - b.tick)
	const bpm = midi.header.tempos.length > 0 ? midi.header.tempos[0].bpm : 120
	const durationTicks = notes.length > 0 ? notes[notes.length - 1].tick + 20 : 0
	const stepInterval = parkourStepIntervalForSpeed(WALL_SPEED)
	const chart = generateChart(notes, durationTicks, bpm, difficulty, WALL_TRAVEL_OFFSET, stepInterval)

	return { name: displayName, difficulty, notes, chart }
}

const DIFFICULTY_SPAWN_TIERS: Record<number, {
	highThreshold: number; lowThreshold: number
	intervals: [number, number, number]
}> = {
	1: { highThreshold: 2.0, lowThreshold: 1.0, intervals: [4, 8, 16] },
	2: { highThreshold: 1.8, lowThreshold: 0.8, intervals: [2, 4, 8] },
	3: { highThreshold: 1.5, lowThreshold: 0.5, intervals: [2, 4, 8] },
	4: { highThreshold: 1.0, lowThreshold: 0.3, intervals: [2, 4, 8] },
	5: { highThreshold: 0.8, lowThreshold: 0.2, intervals: [2, 2, 4] },
}

const MIN_SPAWN_GAP_TICKS = 13

function generateChart(
	notes: SongNote[], durationTicks: number, bpm: number,
	difficulty: number, wallTravelOffset: number, stepInterval: number,
): SongChart {
	if (notes.length === 0) return { beatTicks: [], parkourStepTicks: [], durationTicks: 0 }

	const beatIntervalExact = (60 / bpm) * 20
	const beatInterval = Math.round(beatIntervalExact)
	const totalBeats = Math.ceil(durationTicks / beatInterval)

	const notesPerBeat = new Array(totalBeats).fill(0)
	for (const note of notes) {
		const idx = Math.min(Math.floor(note.tick / beatInterval), totalBeats - 1)
		notesPerBeat[idx]++
	}

	const rollingAvg: number[] = []
	for (let i = 0; i < totalBeats; i++) {
		const start = Math.max(0, i - 4)
		const end = Math.min(totalBeats, i + 5)
		let sum = 0
		for (let j = start; j < end; j++) sum += notesPerBeat[j]
		rollingAvg.push(sum / (end - start))
	}

	const meanDensity = notesPerBeat.reduce((a, b) => a + b, 0) / totalBeats
	const beatTicks: number[] = []
	const tier = DIFFICULTY_SPAWN_TIERS[difficulty] ?? DIFFICULTY_SPAWN_TIERS[3]

	for (let i = 0; i < totalBeats; i++) {
		const localAvg = rollingAvg[i]
		let spawnEvery: number
		if (localAvg > meanDensity * tier.highThreshold) spawnEvery = tier.intervals[0]
		else if (localAvg > meanDensity * tier.lowThreshold) spawnEvery = tier.intervals[1]
		else spawnEvery = tier.intervals[2]

		if (i % spawnEvery !== 0) continue
		if (notesPerBeat[i] === 0) continue

		const spawnTick = Math.round(i * beatIntervalExact) - wallTravelOffset
		if (spawnTick < 0) continue
		if (beatTicks.length > 0 && spawnTick - beatTicks[beatTicks.length - 1] < MIN_SPAWN_GAP_TICKS) continue

		beatTicks.push(spawnTick)
	}

	if (beatTicks.length === 0 && durationTicks > 0) {
		beatTicks.push(Math.max(0, Math.round(durationTicks / 2) - wallTravelOffset))
	}

	const beatsPerStep = Math.max(1, Math.round(stepInterval / beatIntervalExact))
	const snappedStepInterval = Math.round(beatsPerStep * beatIntervalExact)
	const lastStepOffset = (PARKOUR_STEP_COUNT - 1) * snappedStepInterval
	const RESUME_DELAY = 40
	const PRE_BUFFER = 20
	const parkourStepTicks: number[][] = []

	function extractParkourEvent(searchStart: number, searchEnd: number): boolean {
		if (searchEnd <= searchStart || searchStart >= beatTicks.length) return false
		const anchorIdx = Math.min(Math.floor((searchStart + searchEnd) / 2), beatTicks.length - 1)
		const anchorSpawnTick = beatTicks[anchorIdx]
		const windowStart = anchorSpawnTick - PRE_BUFFER
		const windowEnd = anchorSpawnTick + lastStepOffset + RESUME_DELAY
		const before = beatTicks.length
		const remaining = beatTicks.filter(t => t < windowStart || t > windowEnd)
		if (remaining.length === before) return false
		beatTicks.length = 0
		beatTicks.push(...remaining)
		parkourStepTicks.push(
			Array.from({ length: PARKOUR_STEP_COUNT }, (_v, s) => anchorSpawnTick + s * snappedStepInterval),
		)
		return true
	}

	if (beatTicks.length >= 8) {
		extractParkourEvent(Math.floor(beatTicks.length * 0.25), Math.floor(beatTicks.length * 0.55))
	}
	if (beatTicks.length >= 16 && parkourStepTicks.length === 1) {
		const firstAnchor = parkourStepTicks[0][0]
		const gapStart = beatTicks.findIndex(t => t > firstAnchor + lastStepOffset + RESUME_DELAY)
		if (gapStart >= 0) {
			extractParkourEvent(gapStart, Math.min(beatTicks.length, Math.floor(beatTicks.length * 0.85)))
		}
	}
	if (beatTicks.length >= 16 && parkourStepTicks.length === 2) {
		const secondAnchor = parkourStepTicks[1][0]
		const gapStart = beatTicks.findIndex(t => t > secondAnchor + lastStepOffset + RESUME_DELAY)
		if (gapStart >= 0) {
			extractParkourEvent(gapStart, Math.min(beatTicks.length, Math.floor(beatTicks.length * 0.95)))
		}
	}

	return { beatTicks, parkourStepTicks, durationTicks }
}

interface SongLoadResult {
	songs: SongData[]
	songInfos: { safeName: string; segmentCount: number; audioOffsetTicks: number }[]
}

function loadAllSongs(): SongLoadResult {
	const songs: SongData[] = []
	for (const config of songList) {
		const filePath = join(SONGS_DIR, config.file)
		if (!existsSync(filePath)) {
			console.warn(`[songs] MIDI file not found: ${config.file}`)
			continue
		}
		songs.push(parseMidi(filePath, config.name, config.difficulty, !!config.audio))
	}

	renderAllSounds(allSoundKeys)

	const fullSongEntries = songList
		.filter(config => existsSync(join(SONGS_DIR, config.file)))
		.map(config => ({
			midiPath: join(SONGS_DIR, config.file),
			safeName: config.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
			audioPath: config.audio ? join(SONGS_DIR, config.audio) : undefined,
			audioStart: config.audioStart,
			audioOffset: config.audioOffset,
		}))
	const songInfos = renderFullSongs(fullSongEntries)
	return { songs, songInfos }
}

const { songs: allSongs, songInfos: allSongInfos } = loadAllSongs()

export const songCount = allSongs.length
export const songNames = allSongs.map(s => s.name)
export const songData = allSongs

export const songDurations = allSongs.map((s, _i) => {
	const midiDurationSec = Math.ceil(s.chart.durationTicks / 20)
	const safeName = s.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')
	const info = allSongInfos.find(inf => inf.safeName === safeName)
	if (!info || info.segmentCount === 0) return midiDurationSec
	const audioDurationSec = Math.ceil(info.segmentCount * SEGMENT_SECS + info.audioOffsetTicks / 20)
	return Math.max(midiDurationSec, audioDurationSec)
})

export const songSafeNames = allSongs.map(s => s.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'))

export const songSegmentCounts = songSafeNames.map(name => {
	const info = allSongInfos.find(i => i.safeName === name)
	return info?.segmentCount ?? 1
})

export const songAudioOffsets = songSafeNames.map(name => {
	const info = allSongInfos.find(i => i.safeName === name)
	return info?.audioOffsetTicks ?? 0
})

export { SEGMENT_TICKS, getSegmentSoundId } from './render-sounds'
