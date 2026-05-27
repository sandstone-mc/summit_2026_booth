import { _, execute, MCFunction, playsound, schedule, stopsound } from 'sandstone'
import { songCount, songData, songSafeNames, songSegmentCounts, songAudioOffsets, SEGMENT_TICKS, getSegmentSoundId } from '../config/songs'
import { PARKOUR_GRACE_TICKS } from '../config/parkour-paths'
import { status, songSelect } from './state'
import { spawnForDifficulty } from './walls/spawning'
import { stepDispatchFns, parkourCleanup } from './parkour'
import { DIM, NAMESPACE } from '../../../shared'

const songPlayFns: (() => void)[] = []
const songStopFns: (() => void)[] = []
const songWallFns: (() => void)[] = []
const songWallStopFns: (() => void)[] = []

for (let s = 0; s < songCount; s++) {
	const song = songData[s]
	const safeName = songSafeNames[s]
	const nsPrefix = `${NAMESPACE}:sections/rhythm/songs/${safeName}`
	const segmentCount = songSegmentCounts[s]
	const audioOffset = songAudioOffsets[s]

	const segmentFns: { tick: number; fn: () => void; name: string }[] = []
	for (let seg = 0; seg < segmentCount; seg++) {
		const soundId = getSegmentSoundId(safeName, seg)
		const fnName = `sections/rhythm/songs/${safeName}/seg${seg}`
		const fn = MCFunction(fnName, () => {
			execute.in(DIM).run.playsound(soundId, 'record', '@a', '~ ~ ~', 10000)
		}, { lazy: true })
		segmentFns.push({ tick: Math.max(0, seg * SEGMENT_TICKS + audioOffset), fn, name: `${nsPrefix}/seg${seg}` })
	}

	const playFn = MCFunction(`sections/rhythm/songs/${safeName}/play`, () => {
		for (const { tick, fn, name } of segmentFns) {
			if (tick === 0) fn()
			else schedule.function(name, `${tick}t`)
		}
	}, { lazy: true })

	const stopFn = MCFunction(`sections/rhythm/songs/${safeName}/stop`, () => {
		for (const { name } of segmentFns) schedule.clear(name)
		stopsound('@a', 'record')
	}, { lazy: true })

	const diffIdx = Math.max(0, Math.min(4, song.difficulty - 1))
	const spawnFn = spawnForDifficulty[diffIdx]

	const chart = song.chart

	type ScheduledFn = { fn: () => void; name: string }
	const wallBeatFns: ScheduledFn[] = []
	for (let bi = 0; bi < chart.beatTicks.length; bi++) {
		const beatTick = chart.beatTicks[bi]
		const fnName = `sections/rhythm/songs/${safeName}/w${beatTick}`
		const beatFn = MCFunction(fnName, () => { spawnFn() }, { lazy: true })
		wallBeatFns.push({ fn: beatFn, name: `${nsPrefix}/w${beatTick}` })
	}

	const parkourScheduleFns: { tick: number; fn: () => void; name: string }[] = []
	for (const [eventIdx, stepTicks] of chart.parkourStepTicks.entries()) {
		for (let si = 0; si < stepTicks.length; si++) {
			const step = si
			const fnName = `sections/rhythm/songs/${safeName}/pk${eventIdx}_s${step}`
			const fn = MCFunction(fnName, () => { stepDispatchFns[step]() }, { lazy: true })
			parkourScheduleFns.push({ tick: stepTicks[si], fn, name: `${nsPrefix}/pk${eventIdx}_s${step}` })
		}
		const cleanupTick = stepTicks[stepTicks.length - 1] + PARKOUR_GRACE_TICKS
		const cleanupFnName = `sections/rhythm/songs/${safeName}/pk${eventIdx}_end`
		const cleanupFn = MCFunction(cleanupFnName, () => { parkourCleanup() }, { lazy: true })
		parkourScheduleFns.push({ tick: cleanupTick, fn: cleanupFn, name: `${nsPrefix}/pk${eventIdx}_end` })
	}

	const wallFn = MCFunction(`sections/rhythm/songs/${safeName}/walls`, () => {
		for (let i = 0; i < chart.beatTicks.length; i++) {
			const beatTick = chart.beatTicks[i]
			if (beatTick === 0) wallBeatFns[i].fn()
			else schedule.function(wallBeatFns[i].name, `${beatTick}t`)
		}
		for (const { tick, fn, name } of parkourScheduleFns) {
			if (tick === 0) fn()
			else schedule.function(name, `${tick}t`)
		}
	}, { lazy: true })

	const wallStopFn = MCFunction(`sections/rhythm/songs/${safeName}/walls_stop`, () => {
		for (const { name } of wallBeatFns) schedule.clear(name)
		for (const { name } of parkourScheduleFns) schedule.clear(name)
	}, { lazy: true })

	songPlayFns.push(playFn)
	songStopFns.push(stopFn)
	songWallFns.push(wallFn)
	songWallStopFns.push(wallStopFn)
}

export const playSong = MCFunction('sections/rhythm/songs/play', () => {
	if (songCount === 1) { songPlayFns[0](); return }
	let chain = _.if(songSelect.equalTo(0), () => songPlayFns[0]())
	for (let i = 1; i < songCount; i++) {
		const idx = i
		chain = chain.elseIf(songSelect.equalTo(idx), () => songPlayFns[idx]())
	}
}, { lazy: true })

export const stopSong = MCFunction('sections/rhythm/songs/stop', () => {
	for (const fn of songStopFns) fn()
}, { lazy: true })

export const scheduleWalls = MCFunction('sections/rhythm/songs/schedule_walls', () => {
	if (songCount === 1) { songWallFns[0](); return }
	let chain = _.if(songSelect.equalTo(0), () => songWallFns[0]())
	for (let i = 1; i < songCount; i++) {
		const idx = i
		chain = chain.elseIf(songSelect.equalTo(idx), () => songWallFns[idx]())
	}
}, { lazy: true })

export const stopWalls = MCFunction('sections/rhythm/songs/stop_walls', () => {
	for (const fn of songWallStopFns) fn()
}, { lazy: true })
