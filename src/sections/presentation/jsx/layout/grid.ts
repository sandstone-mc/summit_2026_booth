// Square-grid cell layout. Splits the scene's width × height into a
// `ceil(√count)` × `ceil(count/cols)` grid.

export type Cell = { x: number; y: number; width: number; height: number }

export function gridCells(count: number, bounds: readonly [number, number]): Cell[] {
	if (count === 0) return []
	const cols = Math.ceil(Math.sqrt(count))
	const rows = Math.ceil(count / cols)
	const cellW = bounds[0] / cols
	const cellH = bounds[1] / rows
	const cells: Cell[] = []
	for (let i = 0; i < count; i++) {
		const col = i % cols
		const row = Math.floor(i / cols)
		cells.push({ x: col * cellW, y: row * cellH, width: cellW, height: cellH })
	}
	return cells
}