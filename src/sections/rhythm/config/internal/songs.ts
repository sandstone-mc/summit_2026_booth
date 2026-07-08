import { Midi } from '@tonejs/midi'
import { fromArrayBuffer } from '@nbsjs/core'
import { join } from 'path'
import { walls, rendering } from '..'
import { wallMovement } from './derived'
import { PARKOUR_STEP_COUNT, parkourStepIntervalForSpeed } from '../parkour-paths'
import {
	emitSoundsJson,
	getSoundId,
	nearestDurationBucket,
	renderAllSounds,
	renderFullSongs,
	SEGMENT_SECS,
	type SoundKey,
} from './render-sounds'
import { findSongFile, songList } from './song-list'
import { PROJECT_ROOT } from '@shared'

function songSafeName(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9_]/g, '_')
}

export interface SongNote {
	tick: number
	sound: string
	pitch: number
	/* 0..1 loudness from the source note velocity */
	volume: number
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
	usesNoteBlocks: boolean
}

interface NbsInstrument {
	sound: string
	octaveShift: number
}

const NBS_INSTRUMENTS: NbsInstrument[] = [
	{ sound: 'block.note_block.harp', octaveShift: 0 },
	{ sound: 'block.note_block.bass', octaveShift: -2 },
	{ sound: 'block.note_block.basedrum', octaveShift: 0 },
	{ sound: 'block.note_block.snare', octaveShift: 0 },
	{ sound: 'block.note_block.hat', octaveShift: 0 },
	{ sound: 'block.note_block.guitar', octaveShift: -1 },
	{ sound: 'block.note_block.flute', octaveShift: 1 },
	{ sound: 'block.note_block.bell', octaveShift: 2 },
	{ sound: 'block.note_block.chime', octaveShift: 2 },
	{ sound: 'block.note_block.xylophone', octaveShift: 2 },
	{ sound: 'block.note_block.iron_xylophone', octaveShift: 0 },
	{ sound: 'block.note_block.cow_bell', octaveShift: 1 },
	{ sound: 'block.note_block.didgeridoo', octaveShift: -2 },
	{ sound: 'block.note_block.bit', octaveShift: 0 },
	{ sound: 'block.note_block.banjo', octaveShift: 0 },
	{ sound: 'block.note_block.pling', octaveShift: 0 },
]

const PERCUSSION_IDS = new Set([2, 3, 4])

const instrumentsByOctave = new Map<number, number[]>()
for (let i = 0; i < NBS_INSTRUMENTS.length; i++) {
	if (PERCUSSION_IDS.has(i)) continue
	const shift = NBS_INSTRUMENTS[i].octaveShift
	if (!instrumentsByOctave.has(shift)) instrumentsByOctave.set(shift, [])
	instrumentsByOctave.get(shift)!.push(i)
}

function resolveNbsNote(instrumentId: number, key: number): { sound: string; pitch: number } | null {
	if (instrumentId >= NBS_INSTRUMENTS.length) return null

	const semitones = key - 45
	if (semitones >= -12 && semitones <= 12) {
		return { sound: NBS_INSTRUMENTS[instrumentId].sound, pitch: Math.pow(2, semitones / 12) }
	}

	if (PERCUSSION_IDS.has(instrumentId)) {
		const clamped = Math.max(-12, Math.min(12, semitones))
		return { sound: NBS_INSTRUMENTS[instrumentId].sound, pitch: Math.pow(2, clamped / 12) }
	}

	const sourceShift = NBS_INSTRUMENTS[instrumentId].octaveShift
	const octavesNeeded = semitones > 12 ? Math.ceil((semitones - 12) / 12) : Math.floor((semitones + 12) / 12)
	const targetOctave = sourceShift + octavesNeeded
	const candidates = instrumentsByOctave.get(targetOctave)

	if (candidates && candidates.length > 0) {
		const targetId = candidates.includes(instrumentId) ? instrumentId : candidates[0]
		const newKey = key - octavesNeeded * 12
		const newSemitones = newKey - 45
		if (newSemitones >= -12 && newSemitones <= 12) {
			return { sound: NBS_INSTRUMENTS[targetId].sound, pitch: Math.pow(2, newSemitones / 12) }
		}
	}

	let folded = semitones
	while (folded < -12) folded += 12
	while (folded > 12) folded -= 12
	return { sound: NBS_INSTRUMENTS[instrumentId].sound, pitch: Math.pow(2, folded / 12) }
}

const allSoundKeys: SoundKey[] = []

function midiToNoteblock(program: number, isPercussion: boolean, midiNote: number): { sound: string; pitch: number } {
	if (isPercussion) {
		if (midiNote >= 35 && midiNote <= 41) return { sound: 'block.note_block.basedrum', pitch: 1.0 }
		if (midiNote >= 42 && midiNote <= 46) return { sound: 'block.note_block.hat', pitch: 1.0 }
		return { sound: 'block.note_block.snare', pitch: 1.0 }
	}

	let instrument = 'block.note_block.harp'
	if (program >= 0 && program <= 7) instrument = 'block.note_block.harp'
	else if (program >= 8 && program <= 15) instrument = 'block.note_block.chime'
	else if (program >= 16 && program <= 23) instrument = 'block.note_block.guitar'
	else if (program >= 24 && program <= 31) instrument = 'block.note_block.guitar'
	else if (program >= 32 && program <= 39) instrument = 'block.note_block.bass'
	else if (program >= 40 && program <= 47) instrument = 'block.note_block.bass'
	else if (program >= 48 && program <= 55) instrument = 'block.note_block.harp'
	else if (program >= 56 && program <= 63) instrument = 'block.note_block.bit'
	else if (program >= 64 && program <= 71) instrument = 'block.note_block.flute'
	else if (program >= 72 && program <= 79) instrument = 'block.note_block.flute'
	else if (program >= 80 && program <= 95) instrument = 'block.note_block.pling'
	else if (program >= 104 && program <= 111) instrument = 'block.note_block.banjo'
	else if (program >= 112 && program <= 119) instrument = 'block.note_block.iron_xylophone'

	const semitones = midiNote - 60
	let folded = semitones
	while (folded < -12) folded += 12
	while (folded > 12) folded -= 12
	return { sound: instrument, pitch: Math.pow(2, folded / 12) }
}

async function parseMidi(
	filePath: string,
	displayName: string,
	difficulty: number,
	hasAudio: boolean,
): Promise<SongData> {
	const midiData = Buffer.from(await Bun.file(filePath).arrayBuffer())
	const midi = new Midi(midiData)
	const notes: SongNote[] = []
	const useNoteBlocks = rendering === 'compressed' && !hasAudio

	for (const track of midi.tracks) {
		const channel = track.channel
		const program = track.instrument?.number ?? 0
		for (const note of track.notes) {
			const gameTick = Math.round(note.time * 20)
			const isPercussion = channel === 9

			if (useNoteBlocks) {
				const mapped = midiToNoteblock(program, isPercussion, note.midi)
				notes.push({
					tick: gameTick,
					sound: mapped.sound,
					pitch: mapped.pitch,
					volume: Math.min(1.0, note.velocity + 0.3),
				})
			} else {
				const key: SoundKey = {
					program: isPercussion ? 0 : program,
					midiNote: note.midi,
					isPercussion,
					durationBucket: nearestDurationBucket(note.duration),
				}
				if (!hasAudio) allSoundKeys.push(key)
				notes.push({
					tick: gameTick,
					sound: hasAudio ? '' : getSoundId(key),
					pitch: 1.0,
					volume: Math.min(1.0, note.velocity + 0.3),
				})
			}
		}
	}

	notes.sort((a, b) => a.tick - b.tick)
	const bpm = midi.header.tempos.length > 0 ? midi.header.tempos[0].bpm : 120
	const durationTicks = notes.length > 0 ? notes[notes.length - 1].tick + 20 : 0
	const stepInterval = parkourStepIntervalForSpeed(walls.speed)
	const chart = generateChart(notes, durationTicks, bpm, difficulty, wallMovement.travelOffset, stepInterval)

	return { name: displayName, difficulty, notes, chart, usesNoteBlocks: useNoteBlocks }
}

async function parseNbs(filePath: string, displayName: string, difficulty: number): Promise<SongData> {
	const buffer = Buffer.from(await Bun.file(filePath).arrayBuffer())
	const song = fromArrayBuffer(buffer.buffer)

	const nbsTps = song.getTempo()
	const gameTicksPerNbsTick = 20 / nbsTps

	const notes: SongNote[] = []
	for (const layer of song.layers.all) {
		const layerVolume = (layer.volume ?? 100) / 100
		for (const [tick, note] of Object.entries(layer.notes.all)) {
			const instrumentId = note.instrument
			const nbsTick = Number(tick)
			const gameTick = Math.round(nbsTick * gameTicksPerNbsTick)

			const finePitchSemitones = (note.pitch ?? 0) / 100
			const resolved = resolveNbsNote(instrumentId, (note.key ?? 45) + finePitchSemitones)
			if (!resolved) continue

			const volume = Math.min(1.0, layerVolume * ((note.velocity ?? 100) / 100))
			notes.push({ tick: gameTick, sound: resolved.sound, pitch: resolved.pitch, volume })
		}
	}

	notes.sort((a, b) => a.tick - b.tick)
	const timeSignature = song.timeSignature ?? 4
	const bpm = (nbsTps * 60) / timeSignature
	const durationTicks = notes.length > 0 ? notes[notes.length - 1].tick + 20 : 0
	const stepInterval = parkourStepIntervalForSpeed(walls.speed)
	const chart = generateChart(notes, durationTicks, bpm, difficulty, wallMovement.travelOffset, stepInterval)

	return { name: displayName, difficulty, notes, chart, usesNoteBlocks: true }
}

const DIFFICULTY_SPAWN_TIERS: Record<
	number,
	{
		highThreshold: number
		lowThreshold: number
		intervals: [number, number, number]
	}
> = {
	1: { highThreshold: 2.0, lowThreshold: 1.0, intervals: [4, 8, 16] },
	2: { highThreshold: 1.8, lowThreshold: 0.8, intervals: [2, 4, 8] },
	3: { highThreshold: 1.5, lowThreshold: 0.5, intervals: [2, 4, 8] },
	4: { highThreshold: 1.0, lowThreshold: 0.3, intervals: [2, 4, 8] },
	5: { highThreshold: 0.8, lowThreshold: 0.2, intervals: [2, 2, 4] },
}

const MIN_SPAWN_GAP_TICKS = 13

function generateChart(
	notes: SongNote[],
	durationTicks: number,
	bpm: number,
	difficulty: number,
	wallTravelOffset: number,
	stepInterval: number,
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

	const SECTION_BEATS = 16
	const sectionCount = Math.ceil(totalBeats / SECTION_BEATS)
	for (let sec = 0; sec < sectionCount; sec++) {
		const secStart = sec * SECTION_BEATS
		const secEnd = Math.min((sec + 1) * SECTION_BEATS, totalBeats)

		let secAvg = 0
		for (let i = secStart; i < secEnd; i++) secAvg += rollingAvg[i]
		secAvg /= secEnd - secStart

		let spawnEvery: number
		if (secAvg > meanDensity * tier.highThreshold) spawnEvery = tier.intervals[0]
		else if (secAvg > meanDensity * tier.lowThreshold) spawnEvery = tier.intervals[1]
		else spawnEvery = tier.intervals[2]

		for (let i = secStart; i < secEnd; i += spawnEvery) {
			if (notesPerBeat[i] === 0) continue
			const spawnTick = Math.round(i * beatIntervalExact) - wallTravelOffset
			if (spawnTick < 0) continue
			if (beatTicks.length > 0 && spawnTick - beatTicks[beatTicks.length - 1] < MIN_SPAWN_GAP_TICKS) continue
			beatTicks.push(spawnTick)
		}
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
		const remaining = beatTicks.filter((t) => t < windowStart || t > windowEnd)
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
		const gapStart = beatTicks.findIndex((t) => t > firstAnchor + lastStepOffset + RESUME_DELAY)
		if (gapStart >= 0) {
			extractParkourEvent(gapStart, Math.min(beatTicks.length, Math.floor(beatTicks.length * 0.85)))
		}
	}
	if (beatTicks.length >= 16 && parkourStepTicks.length === 2) {
		const secondAnchor = parkourStepTicks[1][0]
		const gapStart = beatTicks.findIndex((t) => t > secondAnchor + lastStepOffset + RESUME_DELAY)
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

async function loadAllSongs(): Promise<SongLoadResult> {
	const songs: SongData[] = []
	for (const config of songList) {
		const filePath = await findSongFile(config.file)
		if (!filePath) {
			console.warn(`[songs] Song file not found: ${config.file}`)
			continue
		}
		const isNbs = config.file.toLowerCase().endsWith('.nbs')
		if (isNbs) {
			songs.push(await parseNbs(filePath, config.name, config.difficulty))
		} else {
			songs.push(await parseMidi(filePath, config.name, config.difficulty, !!config.audio))
		}
	}

	if (rendering === 'compressed') {
		console.log(`[songs] Compressed mode: noteblock sounds, real audio only for songs with audio files`)
	} else {
		await renderAllSounds(allSoundKeys)
	}

	const fullSongEntries: {
		midiPath: string
		safeName: string
		audioPath?: string
		audioStart?: number
		audioOffset?: number
	}[] = []
	for (const config of songList) {
		const fp = await findSongFile(config.file)
		if (!fp || config.file.toLowerCase().endsWith('.nbs')) continue
		if (rendering === 'compressed' && !config.audio) continue
		const audioPath = config.audio ? await findSongFile(config.audio) : undefined
		fullSongEntries.push({
			midiPath: fp,
			safeName: songSafeName(config.name),
			audioPath,
			audioStart: config.audioStart,
			audioOffset: config.audioOffset,
		})
	}
	const songInfos = await renderFullSongs(fullSongEntries)
	emitSoundsJson()
	return { songs, songInfos }
}

const { songs: allSongs, songInfos: allSongInfos } = await loadAllSongs()

export const songCount = allSongs.length
export const songNames = allSongs.map((s) => s.name)
export const songData = allSongs

export const songDurations = allSongs.map((s, _i) => {
	const midiDurationSec = Math.ceil(s.chart.durationTicks / 20)
	const safeName = songSafeName(s.name)
	const info = allSongInfos.find((inf) => inf.safeName === safeName)
	if (!info || info.segmentCount === 0) return midiDurationSec
	const audioDurationSec = Math.ceil(info.segmentCount * SEGMENT_SECS + info.audioOffsetTicks / 20)
	return Math.max(midiDurationSec, audioDurationSec)
})

export const songSafeNames = allSongs.map((s) => songSafeName(s.name))

const duplicateSafeNames = songSafeNames.filter((name, i) => songSafeNames.indexOf(name) !== i)
if (duplicateSafeNames.length > 0) {
	throw new Error(`[songs] Song names collide after normalization: ${duplicateSafeNames.join(', ')}`)
}

export const songSegmentCounts = songSafeNames.map((name) => {
	const info = allSongInfos.find((i) => i.safeName === name)
	return info?.segmentCount ?? 1
})

export const songAudioOffsets = songSafeNames.map((name) => {
	const info = allSongInfos.find((i) => i.safeName === name)
	return info?.audioOffsetTicks ?? 0
})

export const songUsesNoteBlocks = allSongs.map((s) => s.usesNoteBlocks)

export { SEGMENT_TICKS, getSegmentSoundId } from './render-sounds'
