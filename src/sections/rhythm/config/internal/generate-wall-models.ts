import sharp from 'sharp'
import { ItemModelDefinition, Model, Texture } from 'sandstone'
import { pattern, CellType, project, type Cell } from '..'
import { singles, groups, type Obstacle } from '../obstacles'

const CELL_SCALE = 16 / pattern.width
const HALF_CELL = CELL_SCALE / 2
const Z_OFFSET = 8 + CELL_SCALE - 0.3 * 16 / pattern.width
const round = (v: number) => Math.round(v * 1000) / 1000

// Border flags — bitfield describing which edges/corners need a border line
const BORDER_LEFT   = 1,    BORDER_RIGHT  = 2,    BORDER_TOP    = 4,    BORDER_BOTTOM = 8
const CORNER_TL     = 16,   CORNER_TR     = 32,   CORNER_BL     = 64,  CORNER_BR     = 128
const HALF_LEFT_TOP = 256,  HALF_LEFT_BOT = 512,  HALF_RIGHT_TOP = 1024, HALF_RIGHT_BOT = 2048

const BORDER_WIDTH = 2
const FILL_COLOR: [number, number, number, number] = [240, 240, 255, 160]
const EDGE_COLOR: [number, number, number, number] = [240, 240, 255, 255]

function cellBottom(cell: NonNullable<Cell>): number {
	return cell === CellType.SLAB_TOP ? 0.5 : 0
}

function cellTop(cell: NonNullable<Cell>): number {
	return cell === CellType.SLAB_BOTTOM ? 0.5 : 1
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

	if (!hasOverlap(grid[y]?.[x - 1] ?? null, myBottom, myTop)) flags |= BORDER_RIGHT
	if (!hasOverlap(grid[y]?.[x + 1] ?? null, myBottom, myTop)) flags |= BORDER_LEFT

	const above = grid[y + 1]?.[x] ?? null
	if (!above || cellBottom(above) > myTop - 1) flags |= BORDER_TOP

	const below = grid[y - 1]?.[x] ?? null
	if (!below || cellTop(below) < 1 + myBottom) flags |= BORDER_BOTTOM

	if (!(flags & BORDER_LEFT) && !(flags & BORDER_TOP)) {
		if (!hasOverlap(grid[y + 1]?.[x + 1] ?? null, myBottom, myTop)) flags |= CORNER_TL
	}
	if (!(flags & BORDER_RIGHT) && !(flags & BORDER_TOP)) {
		if (!hasOverlap(grid[y + 1]?.[x - 1] ?? null, myBottom, myTop)) flags |= CORNER_TR
	}
	if (!(flags & BORDER_LEFT) && !(flags & BORDER_BOTTOM)) {
		if (!hasOverlap(grid[y - 1]?.[x + 1] ?? null, myBottom, myTop)) flags |= CORNER_BL
	}
	if (!(flags & BORDER_RIGHT) && !(flags & BORDER_BOTTOM)) {
		if (!hasOverlap(grid[y - 1]?.[x - 1] ?? null, myBottom, myTop)) flags |= CORNER_BR
	}

	const left = grid[y]?.[x - 1] ?? null
	const right = grid[y]?.[x + 1] ?? null

	if (!(flags & BORDER_RIGHT) && left && !coversRange(left, myBottom, myTop)) {
		if (cellTop(left) < myTop) flags |= HALF_RIGHT_TOP
		if (cellBottom(left) > myBottom) flags |= HALF_RIGHT_BOT
	}
	if (!(flags & BORDER_LEFT) && right && !coversRange(right, myBottom, myTop)) {
		if (cellTop(right) < myTop) flags |= HALF_LEFT_TOP
		if (cellBottom(right) > myBottom) flags |= HALF_LEFT_BOT
	}

	return flags
}

function generateBorderTexture(flags: number): Promise<Buffer> {
	const size = 16
	const pixels = Buffer.alloc(size * size * 4)

	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const offset = (y * size + x) * 4
			let color = FILL_COLOR

			if ((flags & BORDER_LEFT)      && x < BORDER_WIDTH) color = EDGE_COLOR
			if ((flags & BORDER_RIGHT)     && x >= size - BORDER_WIDTH) color = EDGE_COLOR
			if ((flags & BORDER_TOP)       && y < BORDER_WIDTH) color = EDGE_COLOR
			if ((flags & BORDER_BOTTOM)    && y >= size - BORDER_WIDTH) color = EDGE_COLOR
			if ((flags & CORNER_TL)        && x < BORDER_WIDTH && y < BORDER_WIDTH) color = EDGE_COLOR
			if ((flags & CORNER_TR)        && x >= size - BORDER_WIDTH && y < BORDER_WIDTH) color = EDGE_COLOR
			if ((flags & CORNER_BL)        && x < BORDER_WIDTH && y >= size - BORDER_WIDTH) color = EDGE_COLOR
			if ((flags & CORNER_BR)        && x >= size - BORDER_WIDTH && y >= size - BORDER_WIDTH) color = EDGE_COLOR
			if ((flags & HALF_LEFT_TOP)    && x < BORDER_WIDTH && y < 8) color = EDGE_COLOR
			if ((flags & HALF_LEFT_BOT)    && x < BORDER_WIDTH && y >= 8) color = EDGE_COLOR
			if ((flags & HALF_RIGHT_TOP)   && x >= size - BORDER_WIDTH && y < 8) color = EDGE_COLOR
			if ((flags & HALF_RIGHT_BOT)   && x >= size - BORDER_WIDTH && y >= 8) color = EDGE_COLOR

			pixels[offset] = color[0]
			pixels[offset + 1] = color[1]
			pixels[offset + 2] = color[2]
			pixels[offset + 3] = color[3]
		}
	}

	return sharp(pixels, { raw: { width: size, height: size, channels: 4 } })
		.png()
		.toBuffer()
}

function cellToElements(cell: NonNullable<Cell>, x: number, y: number, grid: Cell[][], borderSlot: string): any {
	const x0 = round(x * CELL_SCALE)
	const x1 = round(x0 + CELL_SCALE)
	const z0 = round(Z_OFFSET)
	const z1 = round(Z_OFFSET + CELL_SCALE)

	const myBottom = cellBottom(cell)
	const myTop = cellTop(cell)

	const left = grid[y]?.[x - 1] ?? null
	const right = grid[y]?.[x + 1] ?? null
	const below = grid[y - 1]?.[x] ?? null
	const above = grid[y + 1]?.[x] ?? null

	const faces: Record<string, any> = {}
	const fullUV = { uv: [0, 0, 16, 16], texture: '#0', tintindex: 0 }
	const borderFaceUV = { uv: [0, 0, 16, 16], texture: `#${borderSlot}`, tintindex: 0 }

	if (cell === CellType.FULL) {
		const sideUV = { uv: [0, 0, 16, 16], texture: '#0', tintindex: 0 }
		if (!coversRange(left, myBottom, myTop)) faces.west = sideUV
		if (!coversRange(right, myBottom, myTop)) faces.east = sideUV
		if (!above || cellBottom(above) > 0) faces.up = fullUV
		if (!below || cellTop(below) < 1) faces.down = fullUV
		faces.north = borderFaceUV
		faces.south = sideUV

		return {
			from: [x0, round(y * CELL_SCALE), z0],
			to: [x1, round((y + 1) * CELL_SCALE), z1],
			faces,
		}
	}

	const isTop = cell === CellType.SLAB_TOP
	const y0 = round(y * CELL_SCALE + (isTop ? HALF_CELL : 0))
	const y1 = round(y0 + HALF_CELL)
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
	for (let y = 0; y < pattern.height; y++) {
		for (let x = 0; x < pattern.width; x++) {
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

	const ns = project.namespace
	const textures: Record<string, string> = { '0': `${ns}:item/generated/glass/white`, particle: `${ns}:item/generated/glass/white` }
	for (const [f, s] of flagToSlot) {
		textures[s] = `${ns}:item/generated/glass/border_${f}`
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
	for (let y = 0; y < pattern.height; y++) {
		for (let x = 0; x < pattern.width; x++) {
			const cell = obstacle.grid[y]?.[x]
			if (cell == null) continue
			allBorderFlags.add(getBorderFlags(cell, x, y, obstacle.grid))
		}
	}
}

const whitePng = sharp(Buffer.from(new Uint8Array(16 * 16 * 4).fill(255)), { raw: { width: 16, height: 16, channels: 4 } }).png().toBuffer()
Texture('item', 'generated/glass/white', whitePng)

for (const flags of allBorderFlags) {
	Texture('item', `generated/glass/border_${flags}`, generateBorderTexture(flags))
}

const ns = project.namespace

for (const obstacle of obstacles) {
	const name = modelName(obstacle)
	const genName = `generated/${name}`
	wallModelNames.set(obstacle.name, `${ns}:${genName}`)

	Model('item', genName, obstacleToModel(obstacle))
	ItemModelDefinition(genName, {
		model: { type: 'minecraft:model', model: `${ns}:item/${genName}`, tints: [{ type: 'minecraft:dye', default: 16777215 }] },
	})
}

console.log(`[wall-models] Generated ${obstacles.length} wall models, ${allBorderFlags.size} border textures`)
