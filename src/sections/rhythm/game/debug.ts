import { abs, effect, execute, fill, forceload, gamemode, kill, MCFunction, Selector, stopsound, tag, tp } from 'sandstone'
import { arena } from '@rhythm/config/internal/arena'
import { DIMENSION, Positions } from '@shared'
import { walls, pattern } from '@rhythm/config'
import { GameStatus, Tags, status, songSelect } from './state'
import { stopSong, stopWalls } from './songs'
import { clearWalls } from './walls/spawning'
import { parkourCleanup } from './parkour'
import { clearLaneShulkers, spawnLaneBorder } from './lane-effects'
import { spawnSkybox } from './arena-map'

MCFunction('sections/rhythm/debug/setup', () => {
	execute.in(DIMENSION).run(() => {
		const [fxMin, fzMin] = arena.forceloadMin
		const [fxMax, fzMax] = arena.forceloadMax
		forceload.add(abs(fxMin, fzMin), abs(fxMax, fzMax))

		const [gx, gy, gz] = arena.goldLine
		const sign = -arena.travelSign
		if (arena.wallsTravelAlongZ) {
			const zMin = Math.min(gz - sign * walls.passDistance, gz + sign * walls.spawnDistance)
			const zMax = Math.max(gz - sign * walls.passDistance, gz + sign * walls.spawnDistance)
			fill(
				abs(gx - 1, gy, zMin),
				abs(gx + pattern.width, gy, zMax),
				'minecraft:smooth_stone',
			)
			fill(
				abs(gx, gy, gz),
				abs(gx + pattern.width - 1, gy, gz),
				'minecraft:gold_block',
			)
		} else {
			const xMin = Math.min(gx - sign * walls.passDistance, gx + sign * walls.spawnDistance)
			const xMax = Math.max(gx - sign * walls.passDistance, gx + sign * walls.spawnDistance)
			fill(
				abs(xMin, gy, gz - 1),
				abs(xMax, gy, gz + pattern.width),
				'minecraft:smooth_stone',
			)
			fill(
				abs(gx, gy, gz),
				abs(gx, gy, gz + pattern.width - 1),
				'minecraft:gold_block',
			)
		}
	})
	spawnLaneBorder()
	spawnSkybox()
}, { lazy: true })

MCFunction('sections/rhythm/debug/reset', () => {
	stopSong()
	stopWalls()
	clearWalls()
	parkourCleanup()
	clearLaneShulkers()
	stopsound('@a', 'record')

	execute.as(Selector('@a', { tag: Tags.PLAYER })).run(() => {
		effect.clear('@s')
		tag('@s').remove(Tags.ALIVE)
		tag('@s').remove(Tags.PLAYER)
	})

	status.set(GameStatus.WAITING)
	songSelect.set(0)

	execute.in(DIMENSION).run(() => {
		const [x, y, z] = Positions.BOOTH_RETURN
		tp('@a', abs(x, y, z))
	})
	gamemode('creative', '@a')
}, { lazy: true })

MCFunction('sections/rhythm/debug/tp', () => {
	execute.in(DIMENSION).run(() => {
		const [x, y, z] = Positions.BOOTH_RETURN
		tp('@s', abs(x, y, z))
	})
	gamemode('creative', '@s')
}, { lazy: true })
