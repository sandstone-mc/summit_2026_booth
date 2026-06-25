export interface PanelConfig {
	x: number
	y: number
	z: number
	facing: number
	scale: number
}

export const SETTINGS: PanelConfig = {
	x: 0,
	y: 66,
	z: -11,
	facing: 180,
	scale: 1,
}

export const LEADERBOARD: PanelConfig = {
	x: 5,
	y: 66,
	z: -11,
	facing: 180,
	scale: 1,
}

export const PADDING = '  '
export const MAX_NAME_LEN = 18
export const SCROLL_SPEED = 4
export const RULER = ' '.repeat(35)
