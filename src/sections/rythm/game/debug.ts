import { abs, effect, execute, fill, forceload, gamemode, kill, MCFunction, Selector, stopsound, tag, tp } from 'sandstone'
import { arena } from '../config/arena'
import { PATTERN_WIDTH, WALL_SPAWN_AHEAD, WALL_PASS_BEHIND } from '../config/obstacle-pool'
import { DIM, Positions } from '../../../shared'
import { GameState, Tags, gameState, songScore } from './state'
import { stopSong, stopWalls } from './songs'
import { clearWalls } from './walls/spawning'
import { parkourCleanup } from './parkour'

MCFunction('sections/rythm/debug/setup', () => {
	execute.in(DIM).run(() => {
		const [fxMin, fzMin] = arena.forceloadMin
		const [fxMax, fzMax] = arena.forceloadMax
		forceload.add(abs(fxMin, fzMin), abs(fxMax, fzMax))

		const [bx, by] = arena.playAreaMin
		fill(
			abs(bx - 1, by, -WALL_PASS_BEHIND),
			abs(bx + PATTERN_WIDTH, by, WALL_SPAWN_AHEAD),
			'minecraft:smooth_stone',
		)
	})
}, { lazy: true })

MCFunction('sections/rythm/debug/reset', () => {
	stopSong()
	stopWalls()
	clearWalls()
	parkourCleanup()
	stopsound('@a', 'record')

	execute.as(Selector('@a', { tag: Tags.PLAYER })).run(() => {
		effect.clear('@s')
		tag('@s').remove(Tags.ALIVE)
		tag('@s').remove(Tags.PLAYER)
	})

	gameState.set(GameState.WAITING)
	songScore.set(0)

	execute.in('minecraft:overworld').run(() => {
		const [x, y, z] = Positions.BOOTH_RETURN
		tp('@a', abs(x, y, z))
	})
	gamemode('creative', '@a')
}, { lazy: true })

MCFunction('sections/rythm/debug/tp', () => {
	execute.in('minecraft:overworld').run(() => {
		const [x, y, z] = Positions.BOOTH_RETURN
		tp('@s', abs(x, y, z))
	})
	gamemode('creative', '@s')
}, { lazy: true })
