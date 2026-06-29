// Values computed from the config object. The config file itself stays declarative.

import config from '..'
import sandstoneConfig from '@/sandstone.config'
import type { PanelConfig } from './types'

export const project = {
	namespace: sandstoneConfig.namespace!,
	dimension: 'minecraft:overworld' as const,
}

const totalDistance = config.walls.spawnDistance + config.walls.passDistance
const travelTicks = Math.round(totalDistance / config.walls.speed)
const reachTicks = Math.round(config.walls.spawnDistance / config.walls.speed)
const moveScale = 1000

export const wallMovement = {
	totalDistance,
	travelTicks,
	reachTicks,
	travelOffset: reachTicks + 4,
	lifetime: travelTicks + config.walls.despawnDelay,
	moveScale,
	moveNumerator: totalDistance * moveScale,
}

// The gold line sits centered on the width and (playerRoom + boothWall) blocks from the back.
export const map = {
	size: config.mapLayout.size,
	laneWidth: config.mapLayout.laneWidth,
	boothDepth: config.mapLayout.boothWall,
	laneOffset: {
		x: Math.floor((config.mapLayout.size[0] - config.mapLayout.laneWidth) / 2),
		z: config.mapLayout.playerRoom + config.mapLayout.boothWall,
	},
}

const layoutDepth = config.mapLayout.playable + config.mapLayout.playerRoom + config.mapLayout.boothWall + 1
if (layoutDepth !== config.mapLayout.size[2]) {
	console.warn(`[config] mapLayout depth ${layoutDepth} (playable+playerRoom+boothWall+1) != structure depth ${config.mapLayout.size[2]}. The map will not line up with the gold line.`)
}

function rotateOffset(offset: [number, number, number]): [number, number, number] {
	const [dx, dy, dz] = offset
	switch (config.goldLineDirection) {
		case 'south': return [dx, dy, dz]
		case 'north': return [-dx, dy, -dz]
		case 'east':  return [dz, dy, -dx]
		case 'west':  return [-dz, dy, dx]
	}
}

function rotateFacing(facing: number): number {
	const yawOffset =
		config.goldLineDirection === 'south' ? 0 :
		config.goldLineDirection === 'north' ? 180 :
		config.goldLineDirection === 'west' ? 90 :
		-90
	return facing + yawOffset
}

function panelFrom(offset: [number, number, number], facing: number, scale = 1): PanelConfig {
	const [rx, ry, rz] = rotateOffset(offset)
	return {
		x: config.goldLine[0] + rx,
		y: config.goldLine[1] + ry,
		z: config.goldLine[2] + rz,
		facing: rotateFacing(facing),
		scale,
	}
}

export const panels = {
	settings: panelFrom(config.panels.settingsOffset, 180),
	leaderboard: panelFrom(config.panels.leaderboardOffset, 180),
	maxNameLength: config.panels.maxNameLength,
	scrollSpeed: config.panels.scrollSpeed,
	padding: config.panels.padding,
	ruler: config.panels.ruler,
	background: config.panels.background,
}

// Where the player is teleported on death or return. Center of the booth, on the floor.
export const boothReturn: [number, number, number] = (() => {
	const alongZ = config.goldLineDirection === 'south' || config.goldLineDirection === 'north'
	const sign = (config.goldLineDirection === 'south' || config.goldLineDirection === 'east') ? 1 : -1
	const widthCentre = (config.mapLayout.laneWidth - 1) / 2
	const depthBehind = config.mapLayout.playerRoom + config.mapLayout.boothWall / 2
	const x = alongZ ? config.goldLine[0] + widthCentre : config.goldLine[0] - sign * depthBehind
	const z = alongZ ? config.goldLine[2] - sign * depthBehind : config.goldLine[2] + widthCentre
	return [x, config.goldLine[1] + 1, z]
})()

const COLOR_HASH_PRIME = 83492791

export function wallTintColor(seed: number): number {
	return config.walls.colors[((seed * COLOR_HASH_PRIME) >>> 0) % config.walls.colors.length]
}
