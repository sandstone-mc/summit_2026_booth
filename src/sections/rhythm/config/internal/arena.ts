// Derived arena positions — all computed from goldLine in config/index.ts.

import { goldLine, pattern, walls, wallMovement, map } from '..'

export interface ResolvedArena {
	goldLine: [number, number, number]
	wallsTravelAlongZ: boolean
	spawnOrigin: [number, number, number]
	spawnScaled: number
	initialTranslation: [number, number, number]
	interpolationTranslation: [number, number, number]
	posPath: string
	travelSign: number
	playerSpawn: [number, number, number]
	playerYaw: number
	forceloadMin: [number, number]
	forceloadMax: [number, number]
	playAreaMin: [number, number, number]
	playAreaMax: [number, number, number]
	playAreaCenter: [number, number, number]
	mapOrigin: [number, number, number]
	mapEnd: [number, number, number]
}

const [baseX, baseY, baseZ] = goldLine
const spawnZ = baseZ + walls.spawnDistance
const forceloadMargin = 5

export const arena: ResolvedArena = {
	goldLine,
	wallsTravelAlongZ: true,

	spawnOrigin: [baseX, baseY + 1, spawnZ],
	spawnScaled: spawnZ * wallMovement.moveScale,

	initialTranslation: [-0.5, 0, 0],
	interpolationTranslation: [-0.5, 0, -wallMovement.totalDistance],

	posPath: 'Pos[2]',
	travelSign: -1,

	playerSpawn: [baseX + Math.floor(pattern.width / 2), baseY + 1, baseZ],
	playerYaw: 0,

	forceloadMin: [
		baseX - forceloadMargin,
		Math.min(baseZ - walls.passDistance, spawnZ) - forceloadMargin,
	],
	forceloadMax: [
		baseX + pattern.width + forceloadMargin,
		Math.max(baseZ + walls.passDistance, spawnZ) + forceloadMargin,
	],

	playAreaMin: [baseX, baseY, Math.min(baseZ, baseZ - (pattern.width - 1))],
	playAreaMax: [baseX + pattern.width - 1, baseY, baseZ],
	playAreaCenter: [
		baseX + (pattern.width - 1) / 2,
		baseY + 4,
		baseZ,
	],

	mapOrigin: [
		baseX - map.laneOffset.x,
		baseY,
		baseZ - map.laneOffset.z,
	],
	mapEnd: [
		baseX - map.laneOffset.x + map.size[0] - 1,
		baseY + map.size[1] - 1,
		baseZ - map.laneOffset.z + map.size[2] - 1,
	],
}
