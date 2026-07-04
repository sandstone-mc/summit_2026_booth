import { MCFunction, Selector } from 'sandstone'
import { NAMESPACE, state } from '@shared';

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

	LANE = 'ssb.rhythm.lane',
	LANE_FRAGMENT = 'ssb.rhythm.lane.frag',
	LANE_BORDER = 'ssb.rhythm.lane.border',

	BUTTON_CYCLE = 'ssb.rhythm.btn.cycle',
	BUTTON_START = 'ssb.rhythm.btn.start',
	BUTTON_CYCLE_DISPLAY = 'ssb.rhythm.btn.cycle_display',
	BUTTON_START_DISPLAY = 'ssb.rhythm.btn.start_display',

	UI_SETTINGS = 'ssb.ui.set',
	UI_SETTINGS_TXT = 'ssb.ui.set.txt',
	UI_SONG_INT = 'ssb.ui.set.si',
	UI_LIVES_INT = 'ssb.ui.set.li',
	UI_START_INT = 'ssb.ui.set.gi',

	UI_LEADERBOARD = 'ssb.ui.lb',
	UI_LB_TXT = 'ssb.ui.lb.txt',
	UI_LB_SONG_INT = 'ssb.ui.lb.si',
	UI_LB_CAT_INT = 'ssb.ui.lb.ci',
	UI_LB_MY_INT = 'ssb.ui.lb.mi',

	UI_MAP_INT = 'ssb.ui.set.mi',

	SKYBOX = 'ssb.rhythm.skybox',

	LB_SELECTION = 'ssb.lb.sel',
}

export const BOOTH_ENTITY_TAG = `summit.booth_entity.${NAMESPACE}`
export const DYNAMIC_TAG = 'summit.dynamic'
export const boothTags = (...extra: string[]): Tags[] => [BOOTH_ENTITY_TAG, DYNAMIC_TAG, ...extra] as Tags[]

export const status = state('$status')

export const songSelect = state('$song_select')

MCFunction('sections/rhythm/state/init', () => {
	status.set(GameStatus.WAITING)
	songSelect.set(0)
}, { runOnLoad: true })

export const mapSelect = state('$map_select')

export const lbSongView = state('$lb_song')
export const lbCatView = state('$lb_cat')

// TODO: x/y/z selector
export const alivePlayers = Selector('@a', { tag: [Tags.PLAYER, Tags.ALIVE] })
export const allPlayers = Selector('@a', { tag: Tags.PLAYER })
