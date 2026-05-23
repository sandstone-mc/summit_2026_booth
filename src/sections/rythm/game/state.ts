import { MCFunction, Objective, Selector } from 'sandstone'

export enum GameState {
	WAITING,
	STARTING,
	ACTIVE,
	ENDING,
}

export enum Tags {
	PLAYER = 'ssb.player',
	ALIVE = 'ssb.alive',

	WALL = 'ssb.wall',
	WALL_NEW = 'ssb.wall.new',
	WALL_WAIT = 'ssb.wall.wait',
	WALL_INIT = 'ssb.wall.init',
	WALL_HIT = 'ssb.wall.hit',
	WALL_GHAST = 'ssb.wall.ghast',
	WALL_CD = 'ssb.wall.cd',
	HIT_TICK = 'ssb.hit_tick',

	PARKOUR = 'ssb.parkour',
	PK_REWARD = 'ssb.pk.reward',
	PK_DONE = 'ssb.pk.done',
	PK_FRESH = 'ssb.pk.fresh',
	PK_TRIGGER = 'ssb.pk.trigger',

	BTN_CYCLE = 'ssb.btn.cycle',
	BTN_START = 'ssb.btn.start',
	BTN_CYCLE_DISPLAY = 'ssb.btn.cycle_display',
	BTN_START_DISPLAY = 'ssb.btn.start_display',
}

const state = Objective.create('ssb_state', 'dummy')
export const gameState = state('$game')

const songSelected = Objective.create('ssb_song', 'dummy')
export const songScore = songSelected('$song')

MCFunction('sections/rythm/state/init', () => {
	gameState.set(GameState.WAITING)
	songScore.set(0)
}, { runOnLoad: true })

export const livesDefault = 3

export const alivePlayers = Selector('@a', { tag: [Tags.PLAYER, Tags.ALIVE] })
export const allPlayers = Selector('@a', { tag: Tags.PLAYER })
