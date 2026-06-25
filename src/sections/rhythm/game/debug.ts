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

		const [blockX, blockY] = arena.playAreaMin
		fill(
			abs(blockX - 1, blockY, -walls.passDistance),
			abs(blockX + pattern.width, blockY, walls.spawnDistance),
			'minecraft:smooth_stone',
		)
		fill(
			abs(blockX, blockY, 0),
			abs(blockX + pattern.width - 1, blockY, 0),
			'minecraft:gold_block',
		)
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
