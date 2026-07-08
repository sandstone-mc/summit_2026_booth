import { abs, fill, MCFunction, tellraw, tp } from 'sandstone'
import { arena } from '@rhythm/config/internal/arena'
import { boothReturn } from '@rhythm/config/internal/derived'
import { walls, pattern } from '@rhythm/config'
import { spawnLaneBorder } from './lane-effects'
import { spawnSkybox } from './arena-map'

MCFunction(
	'sections/rhythm/debug/setup',
	() => {
		const [gx, gy, gz] = arena.goldLine
		const zMin = gz - walls.spawnDistance
		const zMax = gz + walls.passDistance
		fill(abs(gx - 1, gy, zMin), abs(gx + pattern.width, gy, zMax), 'minecraft:smooth_stone')
		fill(abs(gx, gy, gz), abs(gx + pattern.width - 1, gy, gz), 'minecraft:gold_block')

		spawnLaneBorder()
		spawnSkybox()
	},
	{ lazy: true },
)

MCFunction(
	'sections/rhythm/debug/tp',
	() => {
		const [x, y, z] = boothReturn
		tp('@s', abs(x, y, z))
	},
	{ lazy: true },
)
