export const WALL_TINT_COLORS = [
	0xF0F0FF,
	0x6699D8,
	0xB24CD8,
	0x4CB2B2,
	0x7F3FB2,
	0xF27FA5,
]

export function wallTintColor(seed: number): number {
	return WALL_TINT_COLORS[((seed * 83492791) >>> 0) % WALL_TINT_COLORS.length]
}
