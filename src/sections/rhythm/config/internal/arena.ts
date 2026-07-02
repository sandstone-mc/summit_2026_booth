import { goldLine, goldLineDirection, pattern, walls } from '..'
import { wallMovement, map } from './derived'

export interface LaneBounds {
	// width and depth are offsets from the gold line. pos() turns them into world coords.
	widthMin: number
	widthMax: number
	depthMin: number
	depthMax: number
	frontDepth: number // booth front wall
	backDepth: number  // far end of the lane
	sideFacing: number
	frontFacing: number
	pos(widthOffset: number, y: number, depthOffset: number): [number, number, number]
}

export interface ResolvedArena {
	goldLine: [number, number, number]
	wallsTravelAlongZ: boolean
	travelSign: number
	playerYaw: number
	wallRotation: [number, number, number, number]
	wallScale: [number, number, number]
	reverseCollisionX: boolean
	spawnOrigin: [number, number, number]
	spawnScaled: number
	initialTranslation: [number, number, number]
	interpolationTranslation: [number, number, number]
	posPath: string
	playerSpawn: [number, number, number]
	forceloadMin: [number, number]
	forceloadMax: [number, number]
	playAreaMin: [number, number, number]
	playAreaMax: [number, number, number]
	playAreaCenter: [number, number, number]
	mapOrigin: [number, number, number]
	mapEnd: [number, number, number]
	mapPlacement: [number, number, number]
	structureRotation: 'none' | 'clockwise_90' | 'counterclockwise_90' | '180'
	structureMirror: 'none' | 'front_back' | 'left_right'
	skyboxScale: [number, number, number]
	particleSpread: [number, number, number]
	lane: LaneBounds
}

const [baseX, baseY, baseZ] = goldLine
const forceloadMargin = 5

const alongZ = goldLineDirection === 'south' || goldLineDirection === 'north'
const sign = (goldLineDirection === 'south' || goldLineDirection === 'east') ? 1 : -1

// Turns an offset from the gold line into world coords. width is across the lane, depth
// is toward the walls. Matches how the walls are placed so the map, lane and walls line up.
function localToWorldXZ(widthOffset: number, depthOffset: number): [number, number] {
	return alongZ
		? [baseX + widthOffset, baseZ + sign * depthOffset]
		: [baseX + sign * depthOffset, baseZ + widthOffset]
}

const yaw =
	goldLineDirection === 'south' ? 0 :
	goldLineDirection === 'north' ? 180 :
	goldLineDirection === 'west' ? 90 :
	-90

const SIN45 = Math.SQRT1_2
const wallRot: [number, number, number, number] =
	goldLineDirection === 'south' ? [0, 1, 0, 0] :
	goldLineDirection === 'north' ? [0, 0, 0, 1] :
	goldLineDirection === 'east'  ? [0, -SIN45, 0, SIN45] :
	[0, SIN45, 0, SIN45]

const wallScaleVec: [number, number, number] = [
	pattern.width,
	pattern.height,
	pattern.width,
]

const spawnPos: [number, number, number] = alongZ
	? [baseX, baseY + 1, baseZ + sign * walls.spawnDistance]
	: [baseX + sign * walls.spawnDistance, baseY + 1, baseZ]

const spawnScaledValue = alongZ
	? (baseZ + sign * walls.spawnDistance) * wallMovement.moveScale
	: (baseX + sign * walls.spawnDistance) * wallMovement.moveScale

const totalDist = wallMovement.totalDistance

const initTrans: [number, number, number] = alongZ
	? [-0.5, 0, 0]
	: [0, 0, -0.5]

const interpTrans: [number, number, number] = alongZ
	? [0, 0, -sign * totalDist]
	: [-sign * totalDist, 0, 0]

const playerSpawnPos: [number, number, number] = alongZ
	? [baseX + Math.floor(pattern.width / 2), baseY + 1, baseZ]
	: [baseX, baseY + 1, baseZ + Math.floor(pattern.width / 2)]

function computeForceload(): { min: [number, number]; max: [number, number] } {
	const sd = walls.spawnDistance
	const pd = walls.passDistance
	const m = forceloadMargin

	if (alongZ) {
		const zMin = Math.min(baseZ - pd, baseZ + sign * sd) - m
		const zMax = Math.max(baseZ + pd, baseZ + sign * sd) + m
		return {
			min: [baseX - m, zMin],
			max: [baseX + pattern.width + m, zMax],
		}
	}
	const xMin = Math.min(baseX - pd, baseX + sign * sd) - m
	const xMax = Math.max(baseX + pd, baseX + sign * sd) + m
	return {
		min: [xMin, baseZ - m],
		max: [xMax, baseZ + pattern.width + m],
	}
}

function computePlayArea() {
	if (alongZ) {
		return {
			min: [baseX, baseY, Math.min(baseZ, baseZ - (pattern.width - 1))] as [number, number, number],
			max: [baseX + pattern.width - 1, baseY, baseZ] as [number, number, number],
			center: [baseX + (pattern.width - 1) / 2, baseY + 4, baseZ] as [number, number, number],
		}
	}
	return {
		min: [baseX, baseY, baseZ] as [number, number, number],
		max: [baseX, baseY, baseZ + pattern.width - 1] as [number, number, number],
		center: [baseX, baseY + 4, baseZ + (pattern.width - 1) / 2] as [number, number, number],
	}
}

// World bounding box of the placed map. Transforms the four corners and takes the min/max.
function computeMapBounds() {
	const [sx, sy, sz] = map.size
	const corners: [number, number][] = [[0, 0], [sx - 1, 0], [0, sz - 1], [sx - 1, sz - 1]]
	let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
	for (const [lx, lz] of corners) {
		const [X, Z] = localToWorldXZ(lx - map.laneOffset.x, lz - map.laneOffset.z)
		if (X < minX) minX = X
		if (X > maxX) maxX = X
		if (Z < minZ) minZ = Z
		if (Z > maxZ) maxZ = Z
	}
	return {
		origin: [minX, baseY, minZ] as [number, number, number],
		end: [maxX, baseY + sy - 1, maxZ] as [number, number, number],
	}
}

function computeLaneBounds(): LaneBounds {
	// Bounds of the lane border, as offsets from the gold line.
	// boothEdge is the booth/playable seam, farEdge is the map edge where walls spawn.
	const boothEdge = map.boothDepth - map.laneOffset.z
	const farEdge = map.size[2] - 1 - map.laneOffset.z
	return {
		widthMin: 0,
		widthMax: map.laneWidth,
		depthMin: boothEdge,
		depthMax: farEdge,
		frontDepth: boothEdge,
		backDepth: farEdge,
		sideFacing: alongZ ? 90 : 0,
		frontFacing: alongZ ? 0 : 90,
		pos: (wo, y, dO) => {
			const [x, z] = localToWorldXZ(wo, dO)
			return [x, y, z]
		},
	}
}

// The map is authored facing south. Other directions flip the depth axis with a mirror.
// In Minecraft's /place the mirror names are backwards: left_right flips Z, front_back
// flips X. So north uses left_right. East and west still need work.
const structureRotation: ResolvedArena['structureRotation'] =
	alongZ ? 'none' :
	goldLineDirection === 'east' ? 'counterclockwise_90' :
	'clockwise_90'

const structureMirror: ResolvedArena['structureMirror'] =
	goldLineDirection === 'north' ? 'left_right' : 'none'

// /place puts the structure's (0,0,0) corner at this position. We place it so the
// structure's gold line lands on the world gold line.
const mapPlacement: [number, number, number] = (() => {
	const [x, z] = localToWorldXZ(-map.laneOffset.x, -map.laneOffset.z)
	return [x, baseY, z]
})()

const fl = computeForceload()
const pa = computePlayArea()
const mb = computeMapBounds()

export const arena: ResolvedArena = {
	goldLine,
	wallsTravelAlongZ: alongZ,
	travelSign: -sign,
	playerYaw: yaw,
	wallRotation: wallRot,
	wallScale: wallScaleVec,
	reverseCollisionX: goldLineDirection === 'east' || goldLineDirection === 'north',

	spawnOrigin: spawnPos,
	spawnScaled: spawnScaledValue,

	initialTranslation: initTrans,
	interpolationTranslation: interpTrans,

	posPath: alongZ ? 'Pos[2]' : 'Pos[0]',

	playerSpawn: playerSpawnPos,

	forceloadMin: fl.min,
	forceloadMax: fl.max,

	playAreaMin: pa.min,
	playAreaMax: pa.max,
	playAreaCenter: pa.center,

	mapOrigin: mb.origin,
	mapEnd: mb.end,
	mapPlacement,

	structureRotation,
	structureMirror,

	skyboxScale: (() => {
		const ITEM_DISPLAY_Y_SCALE = 15 / 16
		const sy = -(map.size[1] / ITEM_DISPLAY_Y_SCALE)
		return [-map.size[0], sy, -map.size[2]] as [number, number, number]
	})(),

	particleSpread: alongZ
		? [2.5, 0.3, 0.3] as [number, number, number]
		: [0.3, 0.3, 2.5] as [number, number, number],

	lane: computeLaneBounds(),
}
