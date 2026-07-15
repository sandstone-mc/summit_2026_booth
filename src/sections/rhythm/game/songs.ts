import { _, abs, execute, Label, MCFunction, playsound, Selector, stopsound } from 'sandstone'
import {
	songCount,
	songData,
	songSafeNames,
	songSegmentCounts,
	songAudioOffsets,
	songUsesNoteBlocks,
	SEGMENT_TICKS,
	getSegmentSoundId,
} from '@rhythm/config/internal/songs'
import { PARKOUR_GRACE_TICKS } from '@rhythm/config/parkour-paths'
import { music } from '@rhythm/config'
import { arena } from '@rhythm/config/internal/arena'
import { boothListeners, songSelect } from './state'
import { spawnForDifficulty } from './walls/spawning'
import { stepDispatchFns, parkourCleanup } from './parkour'

const NBS_BATCH_TICKS = 200
const SEGMENT_VOLUME = 1000
const [musicX, musicY, musicZ] = arena.musicPosition
const musicPos = abs(musicX, musicY, musicZ)

type SongFn = ReturnType<typeof MCFunction>
type ScheduledEntry = { tick: number; fn: SongFn; mode: 'append' | 'replace' }

const BoothListener = Label('rhythm.showcase.listener')

function runOrSchedule({ tick, fn, mode }: ScheduledEntry) {
	if (tick === 0) fn()
	else fn.schedule.function(`${tick}t`, mode)
}

const sharedFns = new Map<string, SongFn>()
const sharedCounters = new Map<string, number>()
function sharedFn(kind: string, key: string, body: () => void): SongFn {
	const mapKey = `${kind}|${key}`
	const existing = sharedFns.get(mapKey)
	if (existing) return existing
	const index = sharedCounters.get(kind) ?? 0
	sharedCounters.set(kind, index + 1)
	const fn = MCFunction(`sections/rhythm/songs/shared/${kind}${index}`, () => {
		execute.as(boothListeners).run(() => {
			BoothListener('@s').add()
		})
		body()
		execute.as(Selector('@a', {
			tag: BoothListener
		})).run(() => {
			BoothListener('@s').remove()
		})
	}, { lazy: true })
	sharedFns.set(mapKey, fn)
	return fn
}

function clearAll(fns: Iterable<SongFn>) {
	for (const fn of fns) fn.schedule.clear()
}

const songPlayFns: SongFn[] = []
const songStopFns: SongFn[] = []
const songWallFns: SongFn[] = []
const songWallStopFns: SongFn[] = []

for (let s = 0; s < songCount; s++) {
	const song = songData[s]
	const safeName = songSafeNames[s]
	const usesNoteBlocks = songUsesNoteBlocks[s]

	let playFn: SongFn
	let stopFn: SongFn

	if (usesNoteBlocks) {
		const notesByTick = new Map<number, typeof song.notes>()
		for (const note of song.notes) {
			const existing = notesByTick.get(note.tick)
			if (existing) existing.push(note)
			else notesByTick.set(note.tick, [note])
		}

		const sortedTicks = [...notesByTick.keys()].sort((a, b) => a - b)
		const maxTick = sortedTicks.length > 0 ? sortedTicks[sortedTicks.length - 1] : 0
		const batchCount = Math.ceil((maxTick + 1) / NBS_BATCH_TICKS)

		const batchFns: ScheduledEntry[] = []
		const usedFns = new Set<SongFn>()
		for (let batch = 0; batch < batchCount; batch++) {
			const batchStart = batch * NBS_BATCH_TICKS
			const batchEnd = batchStart + NBS_BATCH_TICKS
			const ticksInBatch = sortedTicks.filter((t) => t >= batchStart && t < batchEnd)
			if (ticksInBatch.length === 0) continue

			const noteFns: ScheduledEntry[] = []
			for (const tick of ticksInBatch) {
				const notes = [...notesByTick.get(tick)!].sort((a, b) =>
					`${a.sound}|${a.pitch}|${a.volume}`.localeCompare(`${b.sound}|${b.pitch}|${b.volume}`),
				)
				const key = notes.map((n) => `${n.sound}|${n.pitch}|${n.volume}`).join(',')
				const fn = sharedFn('n', key, () => {
					for (const note of notes) {
						execute
							.as(Selector('@a', {
								tag: BoothListener
							}))
							.at('@s')
							.run.playsound(note.sound as any, 'master', '@s', '~ ~ ~', note.volume * music.volume, note.pitch)
					}
				})
				noteFns.push({ tick: tick - batchStart, fn, mode: 'append' })
				usedFns.add(fn)
			}

			const batchKey = noteFns.map(({ tick, fn }) => `${tick}:${fn.name}`).join(',')
			const batchFn = sharedFn('b', batchKey, () => {
				for (const entry of noteFns) runOrSchedule(entry)
			})
			batchFns.push({ tick: batchStart, fn: batchFn, mode: 'append' })
			usedFns.add(batchFn)
		}

		playFn = MCFunction(
			`sections/rhythm/songs/${safeName}/play`,
			() => {
				for (const entry of batchFns) runOrSchedule(entry)
			},
			{ lazy: true },
		)

		stopFn = MCFunction(
			`sections/rhythm/songs/${safeName}/stop`,
			() => {
				clearAll(usedFns)
				stopsound(boothListeners, 'master')
			},
			{ lazy: true },
		)
	} else {
		const segmentCount = songSegmentCounts[s]
		const audioOffset = songAudioOffsets[s]

		const segmentFns: ScheduledEntry[] = []
		for (let seg = 0; seg < segmentCount; seg++) {
			const soundId = getSegmentSoundId(safeName, seg)
			const fn = MCFunction(
				`sections/rhythm/songs/${safeName}/seg${seg}`,
				() => {
					playsound(soundId, 'master', boothListeners, musicPos, SEGMENT_VOLUME)
				},
				{ lazy: true },
			)
			segmentFns.push({ tick: Math.max(0, seg * SEGMENT_TICKS + audioOffset), fn, mode: 'replace' })
		}

		playFn = MCFunction(
			`sections/rhythm/songs/${safeName}/play`,
			() => {
				for (const entry of segmentFns) runOrSchedule(entry)
			},
			{ lazy: true },
		)

		stopFn = MCFunction(
			`sections/rhythm/songs/${safeName}/stop`,
			() => {
				clearAll(segmentFns.map(({ fn }) => fn))
				stopsound(boothListeners, 'master')
			},
			{ lazy: true },
		)
	}

	const diffIdx = Math.max(0, Math.min(4, song.difficulty - 1))
	const spawnFn = spawnForDifficulty[diffIdx]

	const chart = song.chart

	/*
	 * wall spawns and parkour steps schedule existing functions directly (append mode); no wrappers.
	 * the scheduler silently drops a second append of the same function at the same gametime,
	 * so seenWallTicks guards against charts producing colliding entries
	 */
	const seenWallTicks = new Set<string>()
	const wallEntries: ScheduledEntry[] = []
	const usedWallFns = new Set<SongFn>()
	for (const beatTick of chart.beatTicks) {
		wallEntries.push({ tick: beatTick, fn: spawnFn, mode: 'append' })
	}
	usedWallFns.add(spawnFn)

	for (const stepTicks of chart.parkourStepTicks) {
		for (let stepIdx = 0; stepIdx < stepTicks.length; stepIdx++) {
			wallEntries.push({ tick: stepTicks[stepIdx], fn: stepDispatchFns[stepIdx], mode: 'append' })
			usedWallFns.add(stepDispatchFns[stepIdx])
		}
		wallEntries.push({
			tick: stepTicks[stepTicks.length - 1] + PARKOUR_GRACE_TICKS,
			fn: parkourCleanup,
			mode: 'append',
		})
		usedWallFns.add(parkourCleanup)
	}

	for (const entry of wallEntries) {
		const key = `${entry.fn.name}@${entry.tick}`
		if (seenWallTicks.has(key))
			console.warn(`[songs] ${safeName}: duplicate schedule of ${key}, one instance will be dropped in-game`)
		seenWallTicks.add(key)
	}

	const wallFn = MCFunction(
		`sections/rhythm/songs/${safeName}/walls`,
		() => {
			for (const entry of wallEntries) runOrSchedule(entry)
		},
		{ lazy: true },
	)

	const wallStopFn = MCFunction(
		`sections/rhythm/songs/${safeName}/walls_stop`,
		() => {
			clearAll(usedWallFns)
		},
		{ lazy: true },
	)

	songPlayFns.push(playFn)
	songStopFns.push(stopFn)
	songWallFns.push(wallFn)
	songWallStopFns.push(wallStopFn)
}

function dispatchBySong(fns: SongFn[]) {
	if (songCount === 0) return
	if (songCount === 1) {
		fns[0]()
		return
	}
	_.switch(
		songSelect,
		fns.map((fn, songI) => ['case', songI, () => fn()] as const),
	)
}

export const playSong = MCFunction(
	'sections/rhythm/songs/play',
	() => {
		dispatchBySong(songPlayFns)
	},
	{ lazy: true },
)

export const stopSong = MCFunction(
	'sections/rhythm/songs/stop',
	() => {
		dispatchBySong(songStopFns)
	},
	{ lazy: true },
)

export const stopAllSongs = MCFunction(
	'sections/rhythm/songs/stop_all',
	() => {
		for (const fn of songStopFns) fn()
	},
	{ lazy: true },
)

export const scheduleWalls = MCFunction(
	'sections/rhythm/songs/schedule_walls',
	() => {
		dispatchBySong(songWallFns)
	},
	{ lazy: true },
)

export const stopWalls = MCFunction(
	'sections/rhythm/songs/stop_walls',
	() => {
		dispatchBySong(songWallStopFns)
	},
	{ lazy: true },
)

export const stopAllWalls = MCFunction(
	'sections/rhythm/songs/stop_all_walls',
	() => {
		for (const fn of songWallStopFns) fn()
	},
	{ lazy: true },
)
