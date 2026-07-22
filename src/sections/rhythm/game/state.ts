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
	CALIBRATING,
}

export enum Tags {
	PLAYER = 'snd.rhythm.player',
	CALIBRATOR = 'snd.rhythm.cal.player',
	CAL_PAD = 'snd.rhythm.cal.pad',
	NEW_PB = 'snd.rhythm.pb',

	WALL = 'snd.rhythm.wall',
	WALL_NEW = 'snd.rhythm.wall.new',
	WALL_WAIT = 'snd.rhythm.wall.wait',
	WALL_INIT = 'snd.rhythm.wall.init',
	WALL_HIT = 'snd.rhythm.wall.hit',
	WALL_HIT_COOLDOWN = 'snd.rhythm.wall.cd',

	PARKOUR = 'snd.rhythm.parkour',
	PARKOUR_REWARD = 'snd.rhythm.pk.reward',
	PARKOUR_FRESH = 'snd.rhythm.pk.fresh',
	PARKOUR_TRIGGER = 'snd.rhythm.pk.trigger',

	LANE = 'snd.rhythm.lane',
	LANE_MOUNT = 'snd.rhythm.lane.mount',
	LANE_FRAGMENT = 'snd.rhythm.lane.frag',
	LANE_BORDER = 'snd.rhythm.lane.border',

	UI_SETTINGS = 'snd.ui.set',
	UI_SETTINGS_TXT = 'snd.ui.set.txt',
	UI_SET_SONG_TXT = 'snd.ui.set.song',
	UI_SET_LIVES_TXT = 'snd.ui.set.lives',
	UI_SET_MAP_TXT = 'snd.ui.set.map',
	UI_SET_INTERP_TXT = 'snd.ui.set.interp',
	UI_SET_CAL_TXT = 'snd.ui.set.cal',
	UI_SET_BTN_TXT = 'snd.ui.set.btn',
	UI_SONG_INT = 'snd.ui.set.si',
	UI_LIVES_INT = 'snd.ui.set.li',
	UI_START_INT = 'snd.ui.set.gi',

	UI_LEADERBOARD = 'snd.ui.lb',
	UI_LB_TXT = 'snd.ui.lb.txt',
	UI_LB_SONG_TXT = 'snd.ui.lb.song',
	UI_LB_ROWS_TXT = 'snd.ui.lb.rows',
	UI_LB_YOU_TXT = 'snd.ui.lb.you',
	UI_LB_SONG_INT = 'snd.ui.lb.si',
	UI_LB_CAT_INT = 'snd.ui.lb.ci',
	UI_LB_MY_INT = 'snd.ui.lb.mi',

	UI_MAP_INT = 'snd.ui.set.mi',
	UI_INTERP_INT = 'snd.ui.set.ii',
	UI_MS_DOWN_INT = 'snd.ui.set.md',
	UI_MS_UP_INT = 'snd.ui.set.mu',

	SKYBOX = 'snd.rhythm.skybox',

	LB_SELECTION = 'snd.lb.sel',
}

const BOOTH_ENTITY_TAG = `summit.booth_entity.${NAMESPACE}`
const DYNAMIC_TAG = 'summit.dynamic'
export const boothTags = (...extra: string[]): Tags[] => [BOOTH_ENTITY_TAG, DYNAMIC_TAG, ...extra] as Tags[]

export const status = Variable(GameStatus.WAITING)

export const songSelect = Variable(0)
export const mapSelect = Variable(0)
export const interpSetting = Variable(0)

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
