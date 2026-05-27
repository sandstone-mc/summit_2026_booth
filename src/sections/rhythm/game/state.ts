import { MCFunction, Selector } from 'sandstone'
import { state } from '../../../shared';

export enum GameStatus {
	WAITING,
	STARTING,
	ACTIVE,
	ENDING,
}

export enum Tags {
	PLAYER = 'ssb.rhythm.player',
	ALIVE = 'ssb.rhythm.alive',

	WALL = 'ssb.rhythm.wall',
	WALL_NEW = 'ssb.rhythm.wall.new',
	WALL_WAIT = 'ssb.rhythm.wall.wait',
	WALL_INIT = 'ssb.rhythm.wall.init',
	WALL_HIT = 'ssb.rhythm.wall.hit',
	WALL_GHAST = 'ssb.rhythm.wall.ghast',
	WALL_HIT_COOLDOWN = 'ssb.rhythm.wall.cd',
	HIT_TICK = 'ssb.rhythm.hit_tick',

	PARKOUR = 'ssb.rhythm.parkour',
	PARKOUR_REWARD = 'ssb.rhythm.pk.reward',
	PARKOUR_DONE = 'ssb.rhythm.pk.done',
	PARKOUR_FRESH = 'ssb.rhythm.pk.fresh',
	PARKOUR_TRIGGER = 'ssb.rhythm.pk.trigger',

	BUTTON_CYCLE = 'ssb.rhythm.btn.cycle',
	BUTTON_START = 'ssb.rhythm.btn.start',
	BUTTON_CYCLE_DISPLAY = 'ssb.rhythm.btn.cycle_display',
	BUTTON_START_DISPLAY = 'ssb.rhythm.btn.start_display',
}

export const status = state('$status')

export const songSelect = state('$song_select')

MCFunction('sections/rhythm/state/init', () => {
	status.set(GameStatus.WAITING)
	songSelect.set(0)
}, { runOnLoad: true })

export const livesDefault = 3

export const alivePlayers = Selector('@a', { tag: [Tags.PLAYER, Tags.ALIVE] })
export const allPlayers = Selector('@a', { tag: Tags.PLAYER })
