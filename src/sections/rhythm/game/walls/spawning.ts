import { _, abs, execute, kill, MCFunction, NBT, Objective, Selector, summon, tp, Variable } from 'sandstone'
import { pattern, walls, collisions, Difficulty } from '@rhythm/config'
import { wallMovement, wallTintColor } from '@rhythm/config/internal/derived'
import { arena } from '@rhythm/config/internal/arena'
import { singles, groups, type Cell, type Obstacle } from '@rhythm/config/obstacles'
import { Tags, boothTags, voidPark } from '@rhythm/game/state'
import { scoreSwitch } from '@rhythm/flow'

import { wallModelNames } from '@rhythm/config/internal/generate-wall-models'

export const wallAge = Objective.create('rhythm.wall.age', 'dummy')
export const wallDepth = Objective.create('rhythm.wall.depth', 'dummy')

const randomPick = Variable(0)
const lastGroupId = Variable(0)
const shouldContinueGroup = Variable(0)

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
	const cellTopY = cell === 'slab_bottom' ? y + 0.5 : y + 1.0
	const needClearTo = cellTopY + 1.5
	for (let gy = y + 1; gy < pattern.height && gy < Math.ceil(needClearTo); gy++) {
		const other = grid[gy]?.[x]
		if (other == null) continue
		const otherBottom = other === 'slab_top' ? gy + 0.5 : gy
		const otherTop = other === 'full' || other === 'slab_top' ? gy + 1.0 : gy + 0.5
		if (otherBottom < needClearTo && otherTop > cellTopY) return false
	}
	return true
}

const [originX, originY, originZ] = arena.spawnOrigin
function gridToWorld(x: number, y: number): [number, number, number] {
	return [originX + x, originY + y, originZ]
}

function buildObstacleSpawn(obstacle: Obstacle, fnName: string, groupIdx: number): () => void {
	const seed = nameHash(obstacle.name)
	const tint = wallTintColor(seed)
	const modelName = wallModelNames.get(obstacle.name)!

	return MCFunction(
		fnName,
		() => {
			const [ox, oy, oz] = gridToWorld(0, 0)
			const ex = ox + pattern.width / 2
			const ey = oy + pattern.height / 2
			const ez = oz + 0.5

			summon('minecraft:item_display', abs(ex, ey, ez), {
				Tags: boothTags(Tags.WALL, Tags.WALL_NEW),
				interpolation_duration: NBT.int(wallMovement.travelTicks),
				item_display: 'none',
				brightness: { sky: NBT.int(15), block: NBT.int(15) },
				transformation: {
					translation: NBT.float([0, 0, 0]),
					left_rotation: NBT.float(arena.wallRotation),
					scale: NBT.float(arena.wallScale),
					right_rotation: NBT.float([0, 0, 0, 1]),
				},
				item: {
					id: 'minecraft:leather_horse_armor',
					count: NBT.int(1),
					components: {
						// @ts-ignore
						// keys containing ':' must be pre-quoted for snbt
						'"minecraft:item_model"': modelName,
						'"minecraft:dyed_color"': NBT.int(tint),
					},
				},
			})

			for (let y = 0; y < pattern.height; y++) {
				for (let x = 0; x < pattern.width; x++) {
					const cell = obstacle.grid[y]?.[x]
					if (cell == null) continue
					// hitboxes mirror the model grid because the wall model faces the player
					const cx = pattern.width - 1 - x
					const [hx, hy, hz] = gridToWorld(cx, y)

					const cellYOffset = hy + cellInteractionYOffset(cell)
					if (hasHeadroom(obstacle.grid, x, y, cell)) {
						const [gox, goy, goz] = collisions.ghast
						summon('minecraft:happy_ghast', abs(hx + gox, cellYOffset + goy, hz + goz), {
							Tags: boothTags(Tags.WALL, Tags.WALL_HIT, Tags.WALL_NEW),
							NoAI: true,
							NoGravity: true,
							Invulnerable: true,
							Silent: true,
							attributes: [{ id: 'minecraft:scale', base: 0.25 }],
							active_effects: [{ id: 'minecraft:invisibility', duration: NBT.int(-1), show_particles: false }],
						})
					} else {
						const [iox, ioy, ioz] = collisions.interact
						summon('minecraft:interaction', abs(hx + iox, cellYOffset + ioy, hz + ioz), {
							Tags: boothTags(Tags.WALL, Tags.WALL_HIT, Tags.WALL_NEW),
							width: NBT.float(0.5),
							height: NBT.float(cellInteractionHeight(cell)),
						})
					}
				}
			}

			lastGroupId.set(groupIdx)
		},
		{ lazy: true },
	)
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
		spawnFn: buildObstacleSpawn(singles[singleIdx], `sections/rhythm/obstacle/s${singleIdx}`, 0),
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
			spawnFn: buildObstacleSpawn(
				group.obstacles[memberIdx],
				`sections/rhythm/obstacle/g${groupIdx}_m${memberIdx}`,
				groupIdx1,
			),
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
	return MCFunction(
		`sections/rhythm/obstacle/group_${gIdx}`,
		() => {
			if (members.length === 1) {
				poolEntries[members[0]].spawnFn()
			} else {
				execute.store.result.score(randomPick).run.random.value([0, members.length - 1], 'wall_pick')
				scoreSwitch(
					randomPick,
					members.map((member, i) => [i, () => poolEntries[member].spawnFn()]),
				)
			}
		},
		{ lazy: true },
	)
})

const DIFFICULTY_WEIGHTS: Record<Difficulty, Record<Difficulty, number>> = {
	[Difficulty.EASY]: {
		[Difficulty.EASY]: 30,
		[Difficulty.NORMAL]: 40,
		[Difficulty.HARD]: 20,
		[Difficulty.EXPERT]: 10,
		[Difficulty.MASTER]: 0,
	},
	[Difficulty.NORMAL]: {
		[Difficulty.EASY]: 10,
		[Difficulty.NORMAL]: 25,
		[Difficulty.HARD]: 40,
		[Difficulty.EXPERT]: 20,
		[Difficulty.MASTER]: 5,
	},
	[Difficulty.HARD]: {
		[Difficulty.EASY]: 5,
		[Difficulty.NORMAL]: 10,
		[Difficulty.HARD]: 25,
		[Difficulty.EXPERT]: 40,
		[Difficulty.MASTER]: 20,
	},
	[Difficulty.EXPERT]: {
		[Difficulty.EASY]: 0,
		[Difficulty.NORMAL]: 5,
		[Difficulty.HARD]: 15,
		[Difficulty.EXPERT]: 35,
		[Difficulty.MASTER]: 45,
	},
	[Difficulty.MASTER]: {
		[Difficulty.EASY]: 0,
		[Difficulty.NORMAL]: 0,
		[Difficulty.HARD]: 10,
		[Difficulty.EXPERT]: 30,
		[Difficulty.MASTER]: 60,
	},
}

const entriesByDifficulty: Record<Difficulty, number[]> = {
	[Difficulty.EASY]: [],
	[Difficulty.NORMAL]: [],
	[Difficulty.HARD]: [],
	[Difficulty.EXPERT]: [],
	[Difficulty.MASTER]: [],
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
	if (poolEntries.length === 0)
		return MCFunction(`sections/rhythm/obstacle/spawn_d${songDifficulty}`, () => {}, { lazy: true })

	const pool = buildWeightedPool(songDifficulty)
	const sorted = [...pool].sort((a, b) => a - b)

	return MCFunction(
		`sections/rhythm/obstacle/spawn_d${songDifficulty}`,
		() => {
			shouldContinueGroup.set(0)

			if (groupDispatchFns.length > 0) {
				_.if(lastGroupId.greaterThan(0), () => {
					execute.store.result.score(randomPick).run.random.value([0, 99], 'wall_pick')
					_.if(randomPick.lessThan(walls.groupContinuePercent), () => {
						if (groupIdxList.length === 1) {
							groupDispatchFns[0]()
						} else {
							_.switch(
								lastGroupId,
								groupIdxList.map((groupId, i) => ['case', groupId, () => groupDispatchFns[i]()] as const),
							)
						}
						shouldContinueGroup.set(1)
					}).else(() => {
						lastGroupId.set(0)
					})
				})
			}

			_.if(shouldContinueGroup.equalTo(0), () => {
				execute.store.result.score(randomPick).run.random.value([0, sorted.length - 1], 'wall_pick')
				_.switch(
					randomPick,
					sorted.map((entryIdx, i) => ['case', i, () => poolEntries[entryIdx].spawnFn()] as const),
				)
			})
		},
		{ lazy: true },
	)
}

export const spawnForDifficulty = [
	buildDifficultySpawn(Difficulty.EASY),
	buildDifficultySpawn(Difficulty.NORMAL),
	buildDifficultySpawn(Difficulty.HARD),
	buildDifficultySpawn(Difficulty.EXPERT),
	buildDifficultySpawn(Difficulty.MASTER),
]

const doKillWalls = MCFunction(
	'sections/rhythm/obstacle/do_kill',
	() => {
		kill(Selector('@e', { tag: Tags.WALL }))
	},
	{ lazy: true },
)

export const clearWalls = MCFunction(
	'sections/rhythm/obstacle/clear',
	() => {
		tp(Selector('@e', { tag: Tags.WALL }), abs(...voidPark))
		doKillWalls.schedule.function('1t', 'replace')
		lastGroupId.set(0)
	},
	{ lazy: true },
)
