import { _, abs, execute, kill, MCFunction, NBT, Objective, schedule, Selector, summon, tag, tp } from 'sandstone'
import { PATTERN_WIDTH, PATTERN_HEIGHT, WALL_TRAVEL_TICKS, MOVE_SCALE } from '../../config/obstacle-pool'
import { arena } from '../../config/arena'
import { singles, groups, type Cell, type Obstacle } from '../../config/obstacles'
import { Tags } from '../state'
import { DIM, NAMESPACE } from '../../../../shared'
import { wallModelNames } from '../../config/generate-wall-models'
import { wallTintColor } from '../../config/wall-colors'

export const wallAge = Objective.create('rhythm.wall.age', 'dummy')
export const wallDepth = Objective.create('rhythm.wall.depth', 'dummy')

const wallVariable = Objective.create('rhythm.wall_variable')

const pick = wallVariable('$pick')
const lastGroup = wallVariable('$last')
const groupContinue = wallVariable('$continue')

function nameHash(name: string): number {
	let h = 0
	for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0
	return h >>> 0
}

function cellInteractionHeight(cell: NonNullable<Cell>): number {
	return cell === 'full' ? 1.0 : 0.5
}

function cellInteractionYOffset(cell: NonNullable<Cell>): number {
	return cell === 'slab_top' ? 0.5 : 0
}

function hasHeadroom(grid: Cell[][], x: number, y: number, cell: NonNullable<Cell>): boolean {
	const cellTopY = (cell === 'slab_bottom') ? y + 0.5 : y + 1.0
	const needClearTo = cellTopY + 1.5
	for (let gy = y + 1; gy < PATTERN_HEIGHT && gy < Math.ceil(needClearTo); gy++) {
		const other = grid[gy]?.[x]
		if (other == null) continue
		const otherBottom = (other === 'slab_top') ? gy + 0.5 : gy
		const otherTop = (other === 'full' || other === 'slab_top') ? gy + 1.0 : gy + 0.5
		if (otherBottom < needClearTo && otherTop > cellTopY) return false
	}
	return true
}

const [originX, originY, originZ] = arena.spawnOrigin
const widthOnX = arena.posPath === 'Pos[2]'

function gridToWorld(x: number, y: number): [number, number, number] {
	if (widthOnX) return [originX + x, originY + y, originZ]
	return [originX, originY + y, originZ + x]
}

function buildObstacleSpawn(obstacle: Obstacle, fnName: string): () => void {
	const seed = nameHash(obstacle.name)
	const tint = wallTintColor(seed)
	const modelName = wallModelNames.get(obstacle.name)!

	return MCFunction(fnName, () => {
		execute.in(DIM).run(() => {
			const [ox, oy, oz] = gridToWorld(0, 0)
			const ex = ox + (widthOnX ? PATTERN_WIDTH / 2 : 0.5)
			const ey = oy + PATTERN_HEIGHT / 2
			const ez = oz + (widthOnX ? 0.5 : PATTERN_WIDTH / 2)

			summon('minecraft:item_display', abs(ex, ey, ez), {
				Tags: [Tags.WALL, Tags.WALL_NEW],
				interpolation_duration: NBT.int(WALL_TRAVEL_TICKS),
				item_display: 'none',
				transformation: {
					translation: NBT.float([0, 0, 0]),
					left_rotation: NBT.float([0, 1, 0, 0]),
					scale: NBT.float([PATTERN_WIDTH, PATTERN_HEIGHT, PATTERN_WIDTH]),
					right_rotation: NBT.float([0, 0, 0, 1]),
				},
				item: {
					id: 'minecraft:leather_horse_armor',
					count: NBT.int(1),
					components: {
						'"minecraft:item_model"': modelName,
						'"minecraft:dyed_color"': NBT.int(tint),
					},
				},
			})

			for (let y = 0; y < PATTERN_HEIGHT; y++) {
				for (let x = 0; x < PATTERN_WIDTH; x++) {
					const cell = obstacle.grid[y]?.[x]
					if (cell == null) continue
					const [hx, hy, hz] = gridToWorld(x, y)

					if (hasHeadroom(obstacle.grid, x, y, cell)) {
						summon('minecraft:happy_ghast', abs(hx, hy + cellInteractionYOffset(cell), hz), {
							Tags: [Tags.WALL, Tags.WALL_HIT, Tags.WALL_NEW, Tags.WALL_GHAST],
							NoAI: NBT.byte(1),
							NoGravity: NBT.byte(1),
							Invulnerable: NBT.byte(1),
							Silent: NBT.byte(1),
							attributes: [{ id: 'minecraft:scale', base: 0.25 }],
							active_effects: [{ id: 'minecraft:invisibility', duration: NBT.int(-1), show_particles: NBT.byte(0) }],
						})
					} else {
						summon('minecraft:interaction', abs(hx, hy + cellInteractionYOffset(cell), hz), {
							Tags: [Tags.WALL, Tags.WALL_HIT, Tags.WALL_NEW],
							width: NBT.float(0.5),
							height: NBT.float(cellInteractionHeight(cell)),
						})
					}
				}
			}
		})
	}, { lazy: true })
}

interface PoolEntry {
	difficulty: number
	groupIdx: number
	weight: number
	spawnFn: () => void
}

const poolEntries: PoolEntry[] = []

for (let s = 0; s < singles.length; s++) {
	poolEntries.push({
		difficulty: singles[s].difficulty,
		groupIdx: 0,
		weight: 1.0,
		spawnFn: buildObstacleSpawn(singles[s], `sections/rhythm/obstacle/s${s}`),
	})
}

for (let g = 0; g < groups.length; g++) {
	const group = groups[g]
	const groupIdx1 = g + 1
	for (let m = 0; m < group.obstacles.length; m++) {
		poolEntries.push({
			difficulty: group.obstacles[m].difficulty,
			groupIdx: groupIdx1,
			weight: 1.0,
			spawnFn: buildObstacleSpawn(group.obstacles[m], `sections/rhythm/obstacle/g${g}_m${m}`),
		})
	}
}

const groupMembersByIdx = new Map<number, number[]>()
for (let i = 0; i < poolEntries.length; i++) {
	const gIdx = poolEntries[i].groupIdx
	if (gIdx > 0) {
		if (!groupMembersByIdx.has(gIdx)) groupMembersByIdx.set(gIdx, [])
		groupMembersByIdx.get(gIdx)!.push(i)
	}
}

const groupIdxList = [...groupMembersByIdx.keys()].sort((a, b) => a - b)

const groupDispatchFns: (() => void)[] = groupIdxList.map((gIdx, gi) => {
	const members = groupMembersByIdx.get(gIdx)!
	return MCFunction(`sections/rhythm/obstacle/group_${gIdx}`, () => {
		if (members.length === 1) {
			poolEntries[members[0]].spawnFn()
		} else {
			execute.store.result.score(pick.target, pick.objective)
				.run.random.value([0, members.length - 1], 'wall_pick')
			let chain = _.if(pick.equalTo(0), () => poolEntries[members[0]].spawnFn())
			for (let m = 1; m < members.length; m++) {
				const mi = m
				chain = chain.elseIf(pick.equalTo(mi), () => poolEntries[members[mi]].spawnFn())
			}
		}
	}, { lazy: true })
})

const DIFFICULTY_WEIGHTS: Record<number, Record<number, number>> = {
	1: { 1: 30, 2: 40, 3: 20, 4: 10, 5: 0 },
	2: { 1: 10, 2: 25, 3: 40, 4: 20, 5: 5 },
	3: { 1: 5, 2: 10, 3: 25, 4: 40, 5: 20 },
	4: { 1: 0, 2: 5, 3: 15, 4: 35, 5: 45 },
	5: { 1: 0, 2: 0, 3: 10, 4: 30, 5: 60 },
}

const entriesByDifficulty: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] }
for (let i = 0; i < poolEntries.length; i++) {
	const d = poolEntries[i].difficulty
	if (entriesByDifficulty[d]) entriesByDifficulty[d].push(i)
}

function buildWeightedPool(songDifficulty: number): number[] {
	const weights = DIFFICULTY_WEIGHTS[songDifficulty] ?? DIFFICULTY_WEIGHTS[3]
	const pool: number[] = []
	for (let tier = 1; tier <= 5; tier++) {
		const tierEntries = entriesByDifficulty[tier]
		const tierWeight = weights[tier]
		if (tierWeight === 0 || tierEntries.length === 0) continue
		const baseCount = Math.max(1, Math.round(tierWeight / tierEntries.length))
		for (const entryIdx of tierEntries) {
			const count = Math.max(1, Math.round(baseCount * poolEntries[entryIdx].weight))
			for (let j = 0; j < count; j++) pool.push(entryIdx)
		}
	}
	return pool.length === 0 ? Array.from({ length: poolEntries.length }, (_, i) => i) : pool
}

function buildDifficultySpawn(songDifficulty: number) {
	if (poolEntries.length === 0) return MCFunction(`sections/rhythm/obstacle/spawn_d${songDifficulty}`, () => {}, { lazy: true })

	const pool = buildWeightedPool(songDifficulty)
	const sorted = [...pool].sort((a, b) => a - b)
	const ranges: { start: number; entryIdx: number }[] = []
	for (let i = 0; i < sorted.length; i++) {
		if (i === 0 || sorted[i] !== sorted[i - 1]) ranges.push({ start: i, entryIdx: sorted[i] })
	}

	return MCFunction(`sections/rhythm/obstacle/spawn_d${songDifficulty}`, () => {
		groupContinue.set(0)

		if (groupDispatchFns.length > 0) {
			_.if(lastGroup.greaterThan(0), () => {
				execute.store.result.score(pick.target, pick.objective)
					.run.random.value([0, 99], 'wall_pick')
				_.if(pick.lessThan(70), () => {
					if (groupIdxList.length === 1) {
						groupDispatchFns[0]()
					} else {
						let chain = _.if(lastGroup.equalTo(groupIdxList[0]), () => groupDispatchFns[0]())
						for (let g = 1; g < groupIdxList.length; g++) {
							const gi = g
							chain = chain.elseIf(lastGroup.equalTo(groupIdxList[gi]), () => groupDispatchFns[gi]())
						}
					}
					groupContinue.set(1)
				}).else(() => {
					lastGroup.set(0)
				})
			})
		}

		_.if(groupContinue.equalTo(0), () => {
			execute.store.result.score(pick.target, pick.objective)
				.run.random.value([0, sorted.length - 1], 'wall_pick')
			if (ranges.length > 0) {
				let chain = _.if(pick.greaterOrEqualThan(ranges[ranges.length - 1].start), () => {
					poolEntries[ranges[ranges.length - 1].entryIdx].spawnFn()
					lastGroup.set(poolEntries[ranges[ranges.length - 1].entryIdx].groupIdx)
				})
				for (let i = ranges.length - 2; i >= 0; i--) {
					const r = ranges[i]
					chain = chain.elseIf(pick.greaterOrEqualThan(r.start), () => {
						poolEntries[r.entryIdx].spawnFn()
						lastGroup.set(poolEntries[r.entryIdx].groupIdx)
					})
				}
			}
		})
	}, { lazy: true })
}

export const spawnForDifficulty = [
	buildDifficultySpawn(1),
	buildDifficultySpawn(2),
	buildDifficultySpawn(3),
	buildDifficultySpawn(4),
	buildDifficultySpawn(5),
]

const doKillWalls = MCFunction('sections/rhythm/obstacle/do_kill', () => {
	execute.in(DIM).run.kill(Selector('@e', { tag: Tags.WALL }))
}, { lazy: true })

export const clearWalls = MCFunction('sections/rhythm/obstacle/clear', () => {
	execute.in(DIM).run.tp(Selector('@e', { tag: Tags.WALL }), abs(0, -64, 0))
	schedule.function(`${NAMESPACE}:sections/rhythm/obstacle/do_kill`, '1t')
}, { lazy: true })
