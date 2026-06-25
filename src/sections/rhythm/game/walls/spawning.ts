import { _, abs, execute, kill, MCFunction, NBT, Objective, schedule, Selector, summon, tag, tp } from 'sandstone'
import { pattern, wallMovement, walls, Difficulty, wallTintColor } from '@rhythm/config'
import { arena } from '@rhythm/config/internal/arena'
import { singles, groups, type Cell, type Obstacle } from '@rhythm/config/obstacles'
import { Tags } from '@rhythm/game/state'
import { DIMENSION, NAMESPACE } from '@shared'
import { wallModelNames } from '@rhythm/config/internal/generate-wall-models'

export const wallAge = Objective.create('rhythm.wall.age', 'dummy')
export const wallDepth = Objective.create('rhythm.wall.depth', 'dummy')

const wallPickState = Objective.create('rhythm.wall_variable')

const randomPick = wallPickState('$pick')
const lastGroupId = wallPickState('$last')
const shouldContinueGroup = wallPickState('$continue')

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
	for (let gy = y + 1; gy < pattern.height && gy < Math.ceil(needClearTo); gy++) {
		const other = grid[gy]?.[x]
		if (other == null) continue
		const otherBottom = (other === 'slab_top') ? gy + 0.5 : gy
		const otherTop = (other === 'full' || other === 'slab_top') ? gy + 1.0 : gy + 0.5
		if (otherBottom < needClearTo && otherTop > cellTopY) return false
	}
	return true
}

const [originX, originY, originZ] = arena.spawnOrigin
function gridToWorld(x: number, y: number): [number, number, number] {
	if (arena.wallsTravelAlongZ) return [originX + x, originY + y, originZ]
	return [originX, originY + y, originZ + x]
}

function buildObstacleSpawn(obstacle: Obstacle, fnName: string): () => void {
	const seed = nameHash(obstacle.name)
	const tint = wallTintColor(seed)
	const modelName = wallModelNames.get(obstacle.name)!

	return MCFunction(fnName, () => {
		execute.in(DIMENSION).run(() => {
			const [ox, oy, oz] = gridToWorld(0, 0)
			const ex = ox + (arena.wallsTravelAlongZ ? pattern.width / 2 : 0.5)
			const ey = oy + pattern.height / 2
			const ez = oz + (arena.wallsTravelAlongZ ? 0.5 : pattern.width / 2)

			summon('minecraft:item_display', abs(ex, ey, ez), {
				Tags: [Tags.WALL, Tags.WALL_NEW],
				interpolation_duration: NBT.int(wallMovement.travelTicks),
				item_display: 'none',
				transformation: {
					translation: NBT.float([0, 0, 0]),
					left_rotation: NBT.float([0, 1, 0, 0]),
					scale: NBT.float([pattern.width, pattern.height, pattern.width]),
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

			for (let y = 0; y < pattern.height; y++) {
				for (let x = 0; x < pattern.width; x++) {
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

for (let singleIdx = 0; singleIdx < singles.length; singleIdx++) {
	poolEntries.push({
		difficulty: singles[singleIdx].difficulty,
		groupIdx: 0,
		weight: 1.0,
		spawnFn: buildObstacleSpawn(singles[singleIdx], `sections/rhythm/obstacle/s${singleIdx}`),
	})
}

for (let groupIdx = 0; groupIdx < groups.length; groupIdx++) {
	const group = groups[groupIdx]
	const groupIdx1 = groupIdx + 1
	for (let memberIdx = 0; memberIdx < group.obstacles.length; memberIdx++) {
		poolEntries.push({
			difficulty: group.obstacles[memberIdx].difficulty,
			groupIdx: groupIdx1,
			weight: 1.0,
			spawnFn: buildObstacleSpawn(group.obstacles[memberIdx], `sections/rhythm/obstacle/g${groupIdx}_m${memberIdx}`),
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
			execute.store.result.score(randomPick.target, randomPick.objective)
				.run.random.value([0, members.length - 1], 'wall_pick')
			let chain = _.if(randomPick.equalTo(0), () => poolEntries[members[0]].spawnFn())
			for (let memberIdx = 1; memberIdx < members.length; memberIdx++) {
				const mi = memberIdx
				chain = chain.elseIf(randomPick.equalTo(mi), () => poolEntries[members[mi]].spawnFn())
			}
		}
	}, { lazy: true })
})

const DIFFICULTY_WEIGHTS: Record<Difficulty, Record<Difficulty, number>> = {
	[Difficulty.EASY]:   { [Difficulty.EASY]: 30, [Difficulty.NORMAL]: 40, [Difficulty.HARD]: 20, [Difficulty.EXPERT]: 10, [Difficulty.MASTER]: 0 },
	[Difficulty.NORMAL]: { [Difficulty.EASY]: 10, [Difficulty.NORMAL]: 25, [Difficulty.HARD]: 40, [Difficulty.EXPERT]: 20, [Difficulty.MASTER]: 5 },
	[Difficulty.HARD]:   { [Difficulty.EASY]: 5,  [Difficulty.NORMAL]: 10, [Difficulty.HARD]: 25, [Difficulty.EXPERT]: 40, [Difficulty.MASTER]: 20 },
	[Difficulty.EXPERT]: { [Difficulty.EASY]: 0,  [Difficulty.NORMAL]: 5,  [Difficulty.HARD]: 15, [Difficulty.EXPERT]: 35, [Difficulty.MASTER]: 45 },
	[Difficulty.MASTER]: { [Difficulty.EASY]: 0,  [Difficulty.NORMAL]: 0,  [Difficulty.HARD]: 10, [Difficulty.EXPERT]: 30, [Difficulty.MASTER]: 60 },
}

const entriesByDifficulty: Record<Difficulty, number[]> = {
	[Difficulty.EASY]: [], [Difficulty.NORMAL]: [], [Difficulty.HARD]: [], [Difficulty.EXPERT]: [], [Difficulty.MASTER]: [],
}
for (let i = 0; i < poolEntries.length; i++) {
	const difficultyLevel = poolEntries[i].difficulty as Difficulty
	if (entriesByDifficulty[difficultyLevel]) entriesByDifficulty[difficultyLevel].push(i)
}

function buildWeightedPool(songDifficulty: Difficulty): number[] {
	const weights = DIFFICULTY_WEIGHTS[songDifficulty] ?? DIFFICULTY_WEIGHTS[Difficulty.HARD]
	const pool: number[] = []
	for (let tier = Difficulty.EASY as number; tier <= Difficulty.MASTER; tier++) {
		const tierEntries = entriesByDifficulty[tier as Difficulty]
		const tierWeight = weights[tier as Difficulty]
		if (tierWeight === 0 || tierEntries.length === 0) continue
		const baseCount = Math.max(1, Math.round(tierWeight / tierEntries.length))
		for (const entryIdx of tierEntries) {
			const count = Math.max(1, Math.round(baseCount * poolEntries[entryIdx].weight))
			for (let j = 0; j < count; j++) pool.push(entryIdx)
		}
	}
	return pool.length === 0 ? Array.from({ length: poolEntries.length }, (_, i) => i) : pool
}

function buildDifficultySpawn(songDifficulty: Difficulty) {
	if (poolEntries.length === 0) return MCFunction(`sections/rhythm/obstacle/spawn_d${songDifficulty}`, () => {}, { lazy: true })

	const pool = buildWeightedPool(songDifficulty)
	const sorted = [...pool].sort((a, b) => a - b)
	const ranges: { start: number; entryIdx: number }[] = []
	for (let i = 0; i < sorted.length; i++) {
		if (i === 0 || sorted[i] !== sorted[i - 1]) ranges.push({ start: i, entryIdx: sorted[i] })
	}

	return MCFunction(`sections/rhythm/obstacle/spawn_d${songDifficulty}`, () => {
		shouldContinueGroup.set(0)

		if (groupDispatchFns.length > 0) {
			_.if(lastGroupId.greaterThan(0), () => {
				execute.store.result.score(randomPick.target, randomPick.objective)
					.run.random.value([0, 99], 'wall_pick')
				_.if(randomPick.lessThan(walls.groupContinuePercent), () => {
					if (groupIdxList.length === 1) {
						groupDispatchFns[0]()
					} else {
						let chain = _.if(lastGroupId.equalTo(groupIdxList[0]), () => groupDispatchFns[0]())
						for (let groupIdx = 1; groupIdx < groupIdxList.length; groupIdx++) {
							const gi = groupIdx
							chain = chain.elseIf(lastGroupId.equalTo(groupIdxList[gi]), () => groupDispatchFns[gi]())
						}
					}
					shouldContinueGroup.set(1)
				}).else(() => {
					lastGroupId.set(0)
				})
			})
		}

		_.if(shouldContinueGroup.equalTo(0), () => {
			execute.store.result.score(randomPick.target, randomPick.objective)
				.run.random.value([0, sorted.length - 1], 'wall_pick')
			if (ranges.length > 0) {
				let chain = _.if(randomPick.greaterOrEqualThan(ranges[ranges.length - 1].start), () => {
					poolEntries[ranges[ranges.length - 1].entryIdx].spawnFn()
					lastGroupId.set(poolEntries[ranges[ranges.length - 1].entryIdx].groupIdx)
				})
				for (let i = ranges.length - 2; i >= 0; i--) {
					const r = ranges[i]
					chain = chain.elseIf(randomPick.greaterOrEqualThan(r.start), () => {
						poolEntries[r.entryIdx].spawnFn()
						lastGroupId.set(poolEntries[r.entryIdx].groupIdx)
					})
				}
			}
		})
	}, { lazy: true })
}

export const spawnForDifficulty = [
	buildDifficultySpawn(Difficulty.EASY),
	buildDifficultySpawn(Difficulty.NORMAL),
	buildDifficultySpawn(Difficulty.HARD),
	buildDifficultySpawn(Difficulty.EXPERT),
	buildDifficultySpawn(Difficulty.MASTER),
]

const doKillWalls = MCFunction('sections/rhythm/obstacle/do_kill', () => {
	execute.in(DIMENSION).run.kill(Selector('@e', { tag: Tags.WALL }))
}, { lazy: true })

export const clearWalls = MCFunction('sections/rhythm/obstacle/clear', () => {
	execute.in(DIMENSION).run.tp(Selector('@e', { tag: Tags.WALL }), abs(0, -64, 0))
	schedule.function(`${NAMESPACE}:sections/rhythm/obstacle/do_kill`, '1t')
}, { lazy: true })
