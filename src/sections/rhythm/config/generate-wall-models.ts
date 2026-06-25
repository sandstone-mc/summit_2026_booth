import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import { singles, groups, type Cell, type Obstacle } from './obstacles'
import { PATTERN_WIDTH, PATTERN_HEIGHT } from './obstacle-pool'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MODELS_DIR = join(__dirname, '../../../../resources/resourcepack/assets/minecraft/models/item')
const ITEMS_DIR = join(__dirname, '../../../../resources/resourcepack/assets/minecraft/items')
const TEXTURES_DIR = join(__dirname, '../../../../resources/resourcepack/assets/minecraft/textures/item/glass')

const S = 16 / PATTERN_WIDTH
const HALF = S / 2
const Z_OFFSET = 8 + S - 0.3 * 16 / 5
const r = (v: number) => Math.round(v * 1000) / 1000

const B_LEFT = 1, B_RIGHT = 2, B_TOP = 4, B_BOTTOM = 8
const C_TL = 16, C_TR = 32, C_BL = 64, C_BR = 128
const H_LEFT_TOP = 256, H_LEFT_BOT = 512, H_RIGHT_TOP = 1024, H_RIGHT_BOT = 2048

function cellBottom(cell: NonNullable<Cell>): number {
	return cell === 'slab_top' ? 0.5 : 0
}

function cellTop(cell: NonNullable<Cell>): number {
	return cell === 'slab_bottom' ? 0.5 : 1
}

function coversRange(neighbor: Cell, bottom: number, top: number): boolean {
	if (neighbor == null) return false
	return cellBottom(neighbor) <= bottom && cellTop(neighbor) >= top
}

function hasOverlap(neighbor: Cell, myBottom: number, myTop: number): boolean {
	if (neighbor == null) return false
	return cellBottom(neighbor) < myTop && cellTop(neighbor) > myBottom
}

function getBorderFlags(cell: NonNullable<Cell>, x: number, y: number, grid: Cell[][]): number {
	const myBottom = cellBottom(cell)
	const myTop = cellTop(cell)
	let flags = 0

	if (!hasOverlap(grid[y]?.[x - 1] ?? null, myBottom, myTop)) flags |= B_RIGHT
	if (!hasOverlap(grid[y]?.[x + 1] ?? null, myBottom, myTop)) flags |= B_LEFT

	const above = grid[y + 1]?.[x] ?? null
	if (!above || cellBottom(above) > myTop - 1) flags |= B_TOP

	const below = grid[y - 1]?.[x] ?? null
	if (!below || cellTop(below) < 1 + myBottom) flags |= B_BOTTOM

	if (!(flags & B_LEFT) && !(flags & B_TOP)) {
		if (!hasOverlap(grid[y + 1]?.[x + 1] ?? null, myBottom, myTop)) flags |= C_TL
	}
	if (!(flags & B_RIGHT) && !(flags & B_TOP)) {
		if (!hasOverlap(grid[y + 1]?.[x - 1] ?? null, myBottom, myTop)) flags |= C_TR
	}
	if (!(flags & B_LEFT) && !(flags & B_BOTTOM)) {
		if (!hasOverlap(grid[y - 1]?.[x + 1] ?? null, myBottom, myTop)) flags |= C_BL
	}
	if (!(flags & B_RIGHT) && !(flags & B_BOTTOM)) {
		if (!hasOverlap(grid[y - 1]?.[x - 1] ?? null, myBottom, myTop)) flags |= C_BR
	}

	const left = grid[y]?.[x - 1] ?? null
	const right = grid[y]?.[x + 1] ?? null

	if (!(flags & B_RIGHT) && left && !coversRange(left, myBottom, myTop)) {
		if (cellTop(left) < myTop) flags |= H_RIGHT_TOP
		if (cellBottom(left) > myBottom) flags |= H_RIGHT_BOT
	}
	if (!(flags & B_LEFT) && right && !coversRange(right, myBottom, myTop)) {
		if (cellTop(right) < myTop) flags |= H_LEFT_TOP
		if (cellBottom(right) > myBottom) flags |= H_LEFT_BOT
	}

	return flags
}

function generateBorderTexture(flags: number, outPath: string) {
	const script = `
from PIL import Image
img = Image.new('RGBA', (16, 16), (240, 240, 255, 160))
px = img.load()
B, W = 2, (240, 240, 255, 255)
f = ${flags}
for y in range(16):
    for x in range(16):
        if (f & ${B_LEFT}) and x < B: px[x, y] = W
        if (f & ${B_RIGHT}) and x >= 16-B: px[x, y] = W
        if (f & ${B_TOP}) and y < B: px[x, y] = W
        if (f & ${B_BOTTOM}) and y >= 16-B: px[x, y] = W
        if (f & ${C_TL}) and x < B and y < B: px[x, y] = W
        if (f & ${C_TR}) and x >= 16-B and y < B: px[x, y] = W
        if (f & ${C_BL}) and x < B and y >= 16-B: px[x, y] = W
        if (f & ${C_BR}) and x >= 16-B and y >= 16-B: px[x, y] = W
        if (f & ${H_LEFT_TOP}) and x < B and y < 8: px[x, y] = W
        if (f & ${H_LEFT_BOT}) and x < B and y >= 8: px[x, y] = W
        if (f & ${H_RIGHT_TOP}) and x >= 16-B and y < 8: px[x, y] = W
        if (f & ${H_RIGHT_BOT}) and x >= 16-B and y >= 8: px[x, y] = W
img.save('${outPath.replace(/'/g, "\\'")}')
`
	spawnSync('python3', ['-c', script])
}

function cellToElements(cell: NonNullable<Cell>, x: number, y: number, grid: Cell[][], borderSlot: string): any {
	const x0 = r(x * S)
	const x1 = r(x0 + S)
	const z0 = r(Z_OFFSET)
	const z1 = r(Z_OFFSET + S)

	const myBottom = cellBottom(cell)
	const myTop = cellTop(cell)

	const left = grid[y]?.[x - 1] ?? null
	const right = grid[y]?.[x + 1] ?? null
	const below = grid[y - 1]?.[x] ?? null
	const above = grid[y + 1]?.[x] ?? null

	const faces: Record<string, any> = {}
	const fullUV = { uv: [0, 0, 16, 16], texture: '#0', tintindex: 0 }
	const borderFaceUV = { uv: [0, 0, 16, 16], texture: `#${borderSlot}`, tintindex: 0 }

	if (cell === 'full') {
		const sideUV = { uv: [0, 0, 16, 16], texture: '#0', tintindex: 0 }
		if (!coversRange(left, myBottom, myTop)) faces.west = sideUV
		if (!coversRange(right, myBottom, myTop)) faces.east = sideUV
		if (!above || cellBottom(above) > 0) faces.up = fullUV
		if (!below || cellTop(below) < 1) faces.down = fullUV
		faces.north = borderFaceUV
		faces.south = sideUV

		return {
			from: [x0, r(y * S), z0],
			to: [x1, r((y + 1) * S), z1],
			faces,
		}
	}

	const isTop = cell === 'slab_top'
	const y0 = r(y * S + (isTop ? HALF : 0))
	const y1 = r(y0 + HALF)
	const sideUV = { uv: [0, isTop ? 0 : 8, 16, isTop ? 8 : 16], texture: '#0', tintindex: 0 }

	if (!coversRange(left, myBottom, myTop)) faces.west = sideUV
	if (!coversRange(right, myBottom, myTop)) faces.east = sideUV
	faces.north = borderFaceUV
	faces.south = sideUV

	if (isTop) {
		if (!above || cellBottom(above) > 0) faces.up = fullUV
		if (!below || cellTop(below) < 0.5) faces.down = fullUV
	} else {
		if (!above || cellBottom(above) > 0.5) faces.up = fullUV
		if (!below || cellTop(below) < 0) faces.down = fullUV
	}

	return { from: [x0, y0, z0], to: [x1, y1, z1], faces }
}

function obstacleToModel(obstacle: Obstacle) {
	const borderFlagsPerCell: { x: number; y: number; cell: NonNullable<Cell>; flags: number }[] = []
	for (let y = 0; y < PATTERN_HEIGHT; y++) {
		for (let x = 0; x < PATTERN_WIDTH; x++) {
			const cell = obstacle.grid[y]?.[x]
			if (cell == null) continue
			borderFlagsPerCell.push({ x, y, cell, flags: getBorderFlags(cell, x, y, obstacle.grid) })
		}
	}

	const uniqueFlags = [...new Set(borderFlagsPerCell.map(c => c.flags))]
	const flagToSlot = new Map<number, string>()
	let slot = 1
	for (const f of uniqueFlags) {
		flagToSlot.set(f, `${slot}`)
		slot++
	}

	const textures: Record<string, string> = { '0': 'item/glass/white', particle: 'item/glass/white' }
	for (const [f, s] of flagToSlot) {
		textures[s] = `item/glass/border_${f}`
	}

	const elements: any[] = []
	for (const { x, y, cell, flags } of borderFlagsPerCell) {
		const el = cellToElements(cell, x, y, obstacle.grid, flagToSlot.get(flags)!)
		if (Object.keys(el.faces).length > 0) elements.push(el)
	}

	return { textures, elements }
}

function modelName(obstacle: Obstacle): string {
	return `wall_${obstacle.name}`
}

function getAllObstacles(): Obstacle[] {
	const all: Obstacle[] = [...singles]
	for (const group of groups) {
		all.push(...group.obstacles)
	}
	return all
}

export const wallModelNames = new Map<string, string>()

const obstacles = getAllObstacles()

const allBorderFlags = new Set<number>()
for (const obstacle of obstacles) {
	for (let y = 0; y < PATTERN_HEIGHT; y++) {
		for (let x = 0; x < PATTERN_WIDTH; x++) {
			const cell = obstacle.grid[y]?.[x]
			if (cell == null) continue
			allBorderFlags.add(getBorderFlags(cell, x, y, obstacle.grid))
		}
	}
}

mkdirSync(MODELS_DIR, { recursive: true })
mkdirSync(ITEMS_DIR, { recursive: true })
mkdirSync(TEXTURES_DIR, { recursive: true })

for (const flags of allBorderFlags) {
	const outPath = join(TEXTURES_DIR, `border_${flags}.png`)
	generateBorderTexture(flags, outPath)
}

for (const obstacle of obstacles) {
	const name = modelName(obstacle)
	wallModelNames.set(obstacle.name, name)

	const model = obstacleToModel(obstacle)
	writeFileSync(join(MODELS_DIR, `${name}.json`), JSON.stringify(model))

	const itemDef = {
		model: {
			type: 'minecraft:model',
			model: `minecraft:item/${name}`,
			tints: [{ type: 'minecraft:dye', default: 16777215 }],
		},
	}
	writeFileSync(join(ITEMS_DIR, `${name}.json`), JSON.stringify(itemDef))
}

console.log(`[wall-models] Generated ${obstacles.length} wall models, ${allBorderFlags.size} border textures`)
