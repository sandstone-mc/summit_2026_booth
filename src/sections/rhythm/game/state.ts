import { Selector, Variable } from 'sandstone'
import { NAMESPACE } from '@shared'
import { music } from '@rhythm/config'
import { arena } from '@rhythm/config/internal/arena'
import { boothReturn } from '@rhythm/config/internal/derived'

export enum GameStatus {
	WAITING,
	STARTING,
	ACTIVE,
	ENDING,
}

export enum Tags {
	PLAYER = 'ssb.rhythm.player',

	WALL = 'ssb.rhythm.wall',
	WALL_NEW = 'ssb.rhythm.wall.new',
	WALL_WAIT = 'ssb.rhythm.wall.wait',
	WALL_INIT = 'ssb.rhythm.wall.init',
	WALL_HIT = 'ssb.rhythm.wall.hit',
	WALL_HIT_COOLDOWN = 'ssb.rhythm.wall.cd',

	PARKOUR = 'ssb.rhythm.parkour',
	PARKOUR_REWARD = 'ssb.rhythm.pk.reward',
	PARKOUR_FRESH = 'ssb.rhythm.pk.fresh',
	PARKOUR_TRIGGER = 'ssb.rhythm.pk.trigger',

	LANE = 'ssb.rhythm.lane',
	LANE_FRAGMENT = 'ssb.rhythm.lane.frag',
	LANE_BORDER = 'ssb.rhythm.lane.border',

	UI_SETTINGS = 'ssb.ui.set',
	UI_SETTINGS_TXT = 'ssb.ui.set.txt',
	UI_SET_SONG_TXT = 'ssb.ui.set.song',
	UI_SET_LIVES_TXT = 'ssb.ui.set.lives',
	UI_SET_MAP_TXT = 'ssb.ui.set.map',
	UI_SET_BTN_TXT = 'ssb.ui.set.btn',
	UI_SONG_INT = 'ssb.ui.set.si',
	UI_LIVES_INT = 'ssb.ui.set.li',
	UI_START_INT = 'ssb.ui.set.gi',

	UI_LEADERBOARD = 'ssb.ui.lb',
	UI_LB_TXT = 'ssb.ui.lb.txt',
	UI_LB_SONG_TXT = 'ssb.ui.lb.song',
	UI_LB_ROWS_TXT = 'ssb.ui.lb.rows',
	UI_LB_YOU_TXT = 'ssb.ui.lb.you',
	UI_LB_SONG_INT = 'ssb.ui.lb.si',
	UI_LB_CAT_INT = 'ssb.ui.lb.ci',
	UI_LB_MY_INT = 'ssb.ui.lb.mi',

	UI_MAP_INT = 'ssb.ui.set.mi',

	SKYBOX = 'ssb.rhythm.skybox',

	LB_SELECTION = 'ssb.lb.sel',
}

const BOOTH_ENTITY_TAG = `summit.booth_entity.${NAMESPACE}`
const DYNAMIC_TAG = 'summit.dynamic'
export const boothTags = (...extra: string[]): Tags[] => [BOOTH_ENTITY_TAG, DYNAMIC_TAG, ...extra] as Tags[]

export const status = Variable(GameStatus.WAITING)

export const songSelect = Variable(0)
export const mapSelect = Variable(0)

export const leaderboardSongView = Variable(0)
export const leaderboardCategoryView = Variable(0)

export const gamePlayer = Selector('@a', { tag: Tags.PLAYER })

export const boothListeners = Selector('@a', {
	x: arena.musicPosition[0] - music.hearable.dx / 2,
	y: arena.musicPosition[1] - music.hearable.dy / 2,
	z: arena.musicPosition[2] - music.hearable.dz / 2,
	dx: music.hearable.dx,
	dy: music.hearable.dy,
	dz: music.hearable.dz,
})

export const voidPark: [number, number, number] = [boothReturn[0], -64, boothReturn[2]]
