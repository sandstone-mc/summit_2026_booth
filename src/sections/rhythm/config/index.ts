import type { RhythmConfig } from './internal/types'

export { Difficulty, CellType } from './internal/types'
export type { RenderingMode, GoldLineDirection, Cell, PanelConfig, RhythmConfig } from './internal/types'

const config: RhythmConfig = {
	rendering: 'compressed',
	goldLine: [3000, 64, 3000],
	goldLineDirection: 'north',
	pattern: {
		width: 5,
		height: 5,
	},
	walls: {
		speed: 0.5,
		spawnDistance: 20,
		passDistance: 8,
		despawnDelay: 20,
		hitRadius: 0.7,
		breakRadius: 1.5,
		cooldownTicks: 30,
		flashInterval: 3,
		groupContinuePercent: 70,
		colors: [
			0xF0F0FF, // ice white
			0x6699D8, // sky blue
			0xB24CD8, // magenta
			0x4CB2B2, // teal
			0x7F3FB2, // deep purple
			0xF27FA5, // pink
		],
	},
	collisions: {
		interact: [0, 0, 0],
		ghast: [0, 0, 0],
	},
	mapLayout: {
		playable: 19,
		playerRoom: 8,
		boothWall: 1,
		laneWidth: 5,
		size: [21, 9, 30],
		mirrorX: true,
		mirrorZ: true,
		laneShift: [0, 0, 1],
	},
	gameplay: {
		lives: {
			options: [1, 3, 5],
			default: 3,
		},
		countdown: 5,
		scoring: {
			comboBonus: 5,
			comboDivisor: 10,
			maxCombo: 50,
			milestones: [10, 25, 50],
		},
	},
	visuals: {
		border: {
			stripCount: 10,
			height: 1.0,
			defaultColor: [255, 40, 40],
			offset: {
				sides: { a: [0, 0, -0.35], b: [0, 0, 0.45] },
				frontBack: { a: [-0.05, 0, 0], b: [0.05, 0, 0] },
			},
			lengthScale: {
				sides: 1.11,
				frontBack: 1.11,
			},
		},
		glowColors: [
			'aqua', 'blue', 'green', 'yellow',
			'light_purple', 'red', 'gold', 'white',
		],
		pulse: {
			activeScale: 0.55,
			restScale: 0.2,
		},
	},
	music: {
		offset: [0, 0, 0],
		volume: 10000,
		hearable: { dx: 48, dy: 24, dz: 64 },
	},
	leaderboard: {
		size: 10,
		rankColors: ['gold', 'gray', 'red', 'dark_gray'],
	},
	panels: {
		settingsOffset: [0, 2, -10],
		leaderboardOffset: [-4, 2, -10],
		maxNameLength: 18,
		scrollSpeed: 4,
		padding: '  ',
		ruler: ' '.repeat(35),
		background: 0x54000000,
	},
}

export default config

export const rendering = config.rendering
export const goldLine = config.goldLine
export const goldLineDirection = config.goldLineDirection
export const pattern = config.pattern
export const walls = config.walls
export const collisions = config.collisions
export const mapLayout = config.mapLayout
export const gameplay = config.gameplay
export const visuals = config.visuals
export const music = config.music
export const leaderboard = config.leaderboard
