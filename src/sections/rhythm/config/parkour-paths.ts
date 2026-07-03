export const PARKOUR_PATHS: [number, number][][] = [
	[[1, 0], [2, 0], [3, 0], [4, 1], [3, 1], [2, 1], [1, 2], [2, 2], [3, 2], [4, 3], [3, 3], [2, 3], [1, 3], [2, 3], [3, 3]],
	[[3, 0], [2, 0], [1, 0], [0, 1], [1, 1], [2, 1], [3, 2], [2, 2], [1, 2], [0, 3], [1, 3], [2, 3], [3, 3], [2, 3], [1, 3]],
	[[0, 0], [1, 0], [2, 1], [3, 1], [4, 1], [4, 2], [3, 2], [2, 2], [1, 3], [2, 3], [3, 3], [4, 4], [3, 4], [2, 4], [1, 4]],
	[[4, 0], [3, 0], [2, 1], [1, 1], [0, 1], [0, 2], [1, 2], [2, 2], [3, 3], [2, 3], [1, 3], [0, 4], [1, 4], [2, 4], [3, 4]],
	[[2, 0], [3, 1], [2, 1], [1, 1], [0, 2], [1, 2], [2, 2], [3, 3], [2, 3], [1, 3], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3]],
	[[2, 0], [1, 1], [2, 1], [3, 1], [4, 2], [3, 2], [2, 2], [1, 3], [2, 3], [3, 3], [4, 3], [3, 3], [2, 3], [1, 3], [0, 3]],
	[[0, 0], [1, 1], [2, 1], [3, 2], [4, 2], [4, 3], [3, 3], [2, 3], [1, 3], [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [3, 4]],
	[[4, 0], [3, 1], [2, 1], [1, 2], [0, 2], [0, 3], [1, 3], [2, 3], [3, 3], [4, 4], [3, 4], [2, 4], [1, 4], [0, 4], [1, 4]],
]

export const PARKOUR_STEP_COUNT = 15
export const PARKOUR_PATH_COUNT = PARKOUR_PATHS.length

export function parkourStepIntervalForSpeed(wallSpeed: number): number {
	return Math.max(10, Math.round(5.5 / wallSpeed))
}

export const STEP_GLASS = [
	'minecraft:lime_stained_glass',
	'minecraft:green_stained_glass',
	'minecraft:cyan_stained_glass',
	'minecraft:light_blue_stained_glass',
	'minecraft:blue_stained_glass',
	'minecraft:purple_stained_glass',
	'minecraft:magenta_stained_glass',
	'minecraft:pink_stained_glass',
	'minecraft:red_stained_glass',
	'minecraft:orange_stained_glass',
	'minecraft:lime_stained_glass',
	'minecraft:cyan_stained_glass',
	'minecraft:light_blue_stained_glass',
	'minecraft:blue_stained_glass',
	'minecraft:yellow_stained_glass',
] as const

export const STEP_LENGTHS: number[] = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]

export const PARKOUR_BONUS = 15
export const PARKOUR_GRACE_TICKS = 100
