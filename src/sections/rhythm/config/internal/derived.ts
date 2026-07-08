import config from '..'
import type { PanelConfig } from './types'

const totalDistance = config.walls.spawnDistance + config.walls.passDistance
const travelTicks = Math.round(totalDistance / config.walls.speed)
const reachTicks = Math.round(config.walls.spawnDistance / config.walls.speed)
const moveScale = 1000

export const wallMovement = {
	totalDistance,
	travelTicks,
	reachTicks,
	beatReachTicks: reachTicks + Math.round(1 / config.walls.speed),
	travelOffset: reachTicks + 2,
	lifetime: travelTicks + config.walls.despawnDelay,
	moveScale,
	moveNumerator: totalDistance * moveScale,
}

export const map = {
	size: config.mapLayout.size,
	laneWidth: config.mapLayout.laneWidth,
	boothDepth: config.mapLayout.boothWall,
	laneShift: config.mapLayout.laneShift,
	laneOffset: {
		x: Math.floor((config.mapLayout.size[0] - config.mapLayout.laneWidth) / 2),
		z: config.mapLayout.playerRoom + config.mapLayout.boothWall,
	},
}

if (config.pattern.width !== config.mapLayout.laneWidth) {
	console.warn(
		`[config] pattern.width ${config.pattern.width} != mapLayout.laneWidth ${config.mapLayout.laneWidth}. Walls will not line up with the lane.`,
	)
}

const layoutDepth = config.mapLayout.playable + config.mapLayout.playerRoom + config.mapLayout.boothWall + 1
if (layoutDepth !== config.mapLayout.size[2]) {
	console.warn(
		`[config] mapLayout depth ${layoutDepth} (playable+playerRoom+boothWall+1) != structure depth ${config.mapLayout.size[2]}. The map will not line up with the gold line.`,
	)
}

function panelFrom(offset: [number, number, number], facing: number, scale = 1): PanelConfig {
	const [dx, dy, dz] = offset
	const rad = (facing * Math.PI) / 180
	return {
		x: config.goldLine[0] - dx - Math.sin(rad) * 0.05,
		y: config.goldLine[1] + dy,
		z: config.goldLine[2] - dz + Math.cos(rad) * 0.05,
		facing,
		scale,
	}
}

export const panels = {
	settings: panelFrom(config.panels.settingsOffset, config.panels.settingsFacing),
	leaderboard: panelFrom(config.panels.leaderboardOffset, config.panels.leaderboardFacing),
	maxNameLength: config.panels.maxNameLength,
	scrollSpeed: config.panels.scrollSpeed,
	padding: config.panels.padding,
	ruler: config.panels.ruler,
	background: config.panels.background,
}

const BOOTH_SPAWN_GAP = 3
export const boothReturn: [number, number, number] = (() => {
	const widthCentre = (config.mapLayout.laneWidth - 1) / 2
	const depthBehind = config.mapLayout.playerRoom + config.mapLayout.boothWall + BOOTH_SPAWN_GAP
	return [config.goldLine[0] + widthCentre, config.goldLine[1] + 1, config.goldLine[2] + depthBehind]
})()

const COLOR_HASH_PRIME = 83492791

export function wallTintColor(seed: number): number {
	return config.walls.colors[((seed * COLOR_HASH_PRIME) >>> 0) % config.walls.colors.length]
}
