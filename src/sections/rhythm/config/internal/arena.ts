import { goldLine, pattern, walls, music } from '..'
import { wallMovement, map } from './derived'

export interface LaneBounds {
	widthMin: number
	widthMax: number
	depthMin: number
	depthMax: number
	frontDepth: number
	backDepth: number
	sideFacing: number
	frontFacing: number
	pos(widthOffset: number, y: number, depthOffset: number): [number, number, number]
}

export interface ResolvedArena {
	goldLine: [number, number, number]
	playerYaw: number
	wallRotation: [number, number, number, number]
	wallScale: [number, number, number]
	spawnOrigin: [number, number, number]
	spawnScaled: number
	initialTranslation: [number, number, number]
	interpolationTranslation: [number, number, number]
	playerSpawn: [number, number, number]
	laneFloorY: number
	mapOrigin: [number, number, number]
	mapEnd: [number, number, number]
	mapPlacement: [number, number, number]
	musicPosition: [number, number, number]
	structureRotation: 'none' | 'clockwise_90' | 'counterclockwise_90' | '180'
	structureMirror: 'none' | 'front_back' | 'left_right'
	skyboxScale: [number, number, number]
	particleSpread: [number, number, number]
	lane: LaneBounds
}

const [baseX, baseY, baseZ] = goldLine

function localToWorld(widthOffset: number, depthOffset: number): [number, number] {
	return [baseX + widthOffset, baseZ - depthOffset]
}

const mapBounds = (() => {
	const [sizeX, sizeY, sizeZ] = map.size
	const minX = baseX - map.laneOffset.x
	const maxZ = baseZ + map.laneOffset.z
	return {
		origin: [minX, baseY, maxZ - (sizeZ - 1)] as [number, number, number],
		end: [minX + sizeX - 1, baseY + sizeY - 1, maxZ] as [number, number, number],
	}
})()

const lane: LaneBounds = (() => {
	const boothEdge = map.boothDepth - map.laneOffset.z
	const farEdge = map.size[2] - 1 - map.laneOffset.z
	return {
		widthMin: 0,
		widthMax: map.laneWidth,
		depthMin: boothEdge,
		depthMax: farEdge,
		frontDepth: boothEdge,
		backDepth: farEdge,
		sideFacing: 90,
		frontFacing: 0,
		pos: (widthOffset, y, depthOffset) => {
			const [x, z] = localToWorld(widthOffset, depthOffset)
			const [shiftX, shiftY, shiftZ] = map.laneShift
			return [x + shiftX, y + shiftY, z + shiftZ]
		},
	}
})()

const musicPosition: [number, number, number] = (() => {
	const [x, z] = localToWorld(Math.floor(map.laneWidth / 2), 0)
	const [offX, offY, offZ] = music.offset
	return [x + offX, baseY + offY, z + offZ]
})()

export const arena: ResolvedArena = {
	goldLine,
	playerYaw: 180,
	wallRotation: [0, 0, 0, 1],
	wallScale: [pattern.width, pattern.height, pattern.width],

	spawnOrigin: [baseX, baseY + 1, baseZ - walls.spawnDistance],
	spawnScaled: (baseZ - walls.spawnDistance) * wallMovement.moveScale,

	initialTranslation: [-0.5, 0, 0],
	interpolationTranslation: [0, 0, wallMovement.totalDistance],

	playerSpawn: [baseX + Math.floor(pattern.width / 2), baseY + 1, baseZ],

	laneFloorY: baseY,

	mapOrigin: mapBounds.origin,
	mapEnd: mapBounds.end,
	mapPlacement: [mapBounds.origin[0] + map.size[0] - 1, baseY, mapBounds.origin[2]],
	musicPosition,

	structureRotation: 'none',
	structureMirror: 'front_back',

	skyboxScale: [-(map.size[0] - 2), -((map.size[1] - 2) / (15 / 16)), -(map.size[2] - 2)],

	particleSpread: [2.5, 0.3, 0.3],

	lane,
}
