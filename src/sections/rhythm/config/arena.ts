import { WALL_SPAWN_AHEAD, WALL_PASS_BEHIND, WALL_TRAVEL_DISTANCE, PATTERN_WIDTH, MOVE_SCALE } from './obstacle-pool'

interface ResolvedArena {
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
}

const GOLD_LINE_BASE: [number, number, number] = [0, 64, 0]
const [baseX, baseY, baseZ] = GOLD_LINE_BASE

const travelAxisSpawn = baseZ + WALL_SPAWN_AHEAD

export const arena: ResolvedArena = {
	spawnOrigin: [baseX, baseY + 1, travelAxisSpawn],
	spawnScaled: travelAxisSpawn * MOVE_SCALE,
	initialTranslation: [-0.5, 0, 0],
	interpolationTranslation: [-0.5, 0, -WALL_TRAVEL_DISTANCE],
	posPath: 'Pos[2]',
	travelSign: -1,
	playerSpawn: [baseX + Math.floor(PATTERN_WIDTH / 2), baseY + 1, baseZ],
	playerYaw: 0,
	forceloadMin: [baseX - 5, Math.min(baseZ - WALL_PASS_BEHIND, travelAxisSpawn) - 5],
	forceloadMax: [baseX + PATTERN_WIDTH + 5, Math.max(baseZ + WALL_PASS_BEHIND, travelAxisSpawn) + 5],
	playAreaMin: [baseX, baseY, Math.min(baseZ, baseZ - (PATTERN_WIDTH - 1))],
	playAreaMax: [baseX + PATTERN_WIDTH - 1, baseY, baseZ],
	playAreaCenter: [
		(baseX + baseX + PATTERN_WIDTH - 1) / 2,
		baseY + 4,
		baseZ,
	],
}
