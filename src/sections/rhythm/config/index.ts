// Central configuration for the rhythm game section.
//
// Set `goldLine` position and everything derives automatically.
// Panel and map offsets default to sensible values — adjust only if needed.

import sandstoneConfig from '@/sandstone.config'

// Rendering Mode
//
// "extended"   — Full-quality OGG audio segments (fluidsynth/ffmpeg). Large resource pack.
// "compressed" — Noteblock playsounds only. No custom audio files. ~1MB resource pack.

export type RenderingMode = 'extended' | 'compressed'
export const rendering: RenderingMode = 'compressed'

// Project

export const project = {
	namespace: sandstoneConfig.namespace!,
	dimension: 'minecraft:overworld' as const,
}

// Enums

export enum Difficulty {
	EASY = 1,
	NORMAL = 2,
	HARD = 3,
	EXPERT = 4,
	MASTER = 5,
}

export enum CellType {
	FULL = 'full',
	SLAB_BOTTOM = 'slab_bottom',
	SLAB_TOP = 'slab_top',
}

export type Cell = CellType | null

// Gold Line — set this position; everything else derives.

export const goldLine: [number, number, number] = [0, 64, 0]

// Pattern Grid

export const pattern = {
	width: 5,
	height: 5,
}

// Walls

export const walls = {
	speed: 0.5,
	spawnDistance: 30,
	passDistance: 10,
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
}

// Derived Wall Movement

const totalDistance = walls.spawnDistance + walls.passDistance
const travelTicks = Math.round(totalDistance / walls.speed)
const reachTicks = Math.round(walls.spawnDistance / walls.speed)
const moveScale = 1000

export const wallMovement = {
	totalDistance,
	travelTicks,
	reachTicks,
	travelOffset: reachTicks + 4,
	lifetime: travelTicks + walls.despawnDelay,
	moveScale,
	moveNumerator: totalDistance * moveScale,
}

// Map

export const map = {
	size: [21, 10, 41] as [number, number, number],
	laneOffset: { x: 8, z: 10 },
	laneWidth: 5,
}

// Gameplay

export const gameplay = {
	lives: {
		options: [1, 3, 5] as const,
		default: 3,
	},
	countdown: 5,
	scoring: {
		comboBonus: 5,
		comboDivisor: 10,
		maxCombo: 50,
		milestones: [10, 25, 50] as const,
	},
}

// Panels

export interface PanelConfig {
	x: number
	y: number
	z: number
	facing: number
	scale: number
}

function panelFrom(offset: [number, number, number], facing: number, scale = 1): PanelConfig {
	return {
		x: goldLine[0] + offset[0],
		y: goldLine[1] + offset[1],
		z: goldLine[2] + offset[2],
		facing,
		scale,
	}
}

export const panels = {
	settings: panelFrom([0, 2, -11], 180),
	leaderboard: panelFrom([5, 2, -11], 180),
	maxNameLength: 18,
	scrollSpeed: 4,
	padding: '  ',
	ruler: ' '.repeat(35),
	background: 0x54000000,
}

// Booth Return

export const boothReturn: [number, number, number] = [
	goldLine[0] + 2,
	goldLine[1] + 1,
	goldLine[2] - 12,
]

// Visuals

export const visuals = {
	border: {
		stripCount: 10,
		height: 1.0,
		defaultColor: [255, 40, 40] as [number, number, number],
	},
	glowColors: [
		'aqua', 'blue', 'green', 'yellow',
		'light_purple', 'red', 'gold', 'white',
	] as const,
	pulse: {
		activeScale: 0.55,
		restScale: 0.2,
	},
}

// Leaderboard

export const leaderboard = {
	size: 10,
	rankColors: ['gold', 'gray', 'red', 'dark_gray'] as const,
}

// Helpers

const COLOR_HASH_PRIME = 83492791

export function wallTintColor(seed: number): number {
	return walls.colors[((seed * COLOR_HASH_PRIME) >>> 0) % walls.colors.length]
}
